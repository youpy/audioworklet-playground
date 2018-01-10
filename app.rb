require './store'
require 'dotenv/load'
require 'digest/md5'
require 'sinatra/json'
require 'json'

Dotenv.load

helpers do
  def id2key(id)
    'aw_%s' % id
  end
end

set :store, Store.new(ENV['REDIS_URL'])
set :public_folder, 'build/'

get '/' do
  send_file File.join(settings.public_folder, 'index.html')
end

get '/w/:id' do
  id = params[:id]
  item = settings.store.get(id2key(id))

  if item
    send_file File.join(settings.public_folder, 'index.html')
  else
    status 404
    'not found'
  end
end

get '/w/:id/module.js' do
  id = params[:id]
  item = settings.store.get(id2key(id))

  if item
    data = JSON.parse(item)
    processor_name = 'processor-%s' % id
    content_type 'application/javascript'
    headers({ 'Access-Control-Allow-Origin' => '*' })

    <<EOM
let _registerProcessor = registerProcessor;
let registered = false;

registerProcessor = (name, klass) => {
  if (!registered) {
    registered = true;
    _registerProcessor('#{processor_name}', klass);
    registerProcessor = _registerProcessor;
  }
};

#{data['content']}

if (typeof Processor !== 'undefined') {
  registerProcessor('#{processor_name}', Processor);
}
EOM
  else
    status 404
    'not found'
  end
end

get '/w/:id' do
  id = params[:id]
  item = settings.store.get(id2key(id))

  if item
    send_file File.join(settings.public_folder, 'index.html')
  else
    status 404
    'not found'
  end
end

post '/api/w' do
  content = params[:content]
  result = {
    error: nil,
    item: nil
  }

  if content
    id = Digest::MD5.hexdigest(content)
    item = settings.store.get(id2key(id))

    unless item
      item = {
        id: id,
        content: content,
        created_at: Time.now
      }.to_json

      settings.store.set(id2key(id), item)
    end

    result[:item] = JSON.parse(item)
  else
    result[:error] = 'invalid request'
    status 400
  end

  json result
end

get '/api/w/:id' do
  id = params[:id]
  result = {
    error: nil,
    item: nil
  }

  item = settings.store.get(id2key(id))

  if item
    result[:item] = JSON.parse(item)
  else
    result[:error] = 'not found'
    status 404
  end

  json result
end
