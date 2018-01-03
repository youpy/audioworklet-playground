require 'redis'

class Store
  def initialize(redis_url)
    @redis = Redis.new(url: redis_url)
  end

  def get(key)
    @redis.get(key)
  end

  def set(key, value)
    @redis.set(key, value)
  end
end
