import React, { Component } from 'react';
import MonacoEditor from 'react-monaco-editor';
import Worklet from './Worklet.jsx';
import './App.css';

const requireConfig = {
  url: 'https://cdnjs.cloudflare.com/ajax/libs/require.js/2.3.1/require.min.js',
  paths: {
    vs: '/vs'
  }
};
const defaultCode = `class Processor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
   return [{
      name: 'gain',
      defaultValue: 0.3,
      minValue: 0.0,
      maxValue: 1.0
    }];
  }

  process(inputs, outputs, parameters) {
    let input = inputs[0];
    let output = outputs[0];
    for (let channel = 0; channel < output.length; ++channel) {
      output[channel].set(input[channel].map(v => v * parameters.gain[0]));
    }

    return true;
  }
}
`;

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      code: '',
      context: new AudioContext(),
      audioWorkletIsAvailable: !!window.AudioWorklet
    }
  }

  async componentDidMount() {
    const { context } = this.state;
    const res = await fetch('/sample.mp3');
    const arrayBuffer = await res.arrayBuffer();
    const buffer = await context.decodeAudioData(arrayBuffer);

    this.setState({
      buffer
    });
  }

  async editorDidMount(editor, monaco) {
    const { id } = this.props;

    if (typeof id === 'undefined') {
      this.setState({
        code: defaultCode,
        ready: true,
      });
      return;
    }

    const res = await fetch(`/api/w/${id}`);

    if (res.ok) {
      const data = await res.json();

      this.setState({
        id,
        code: data.item.content,
        ready: true
      });
    }
  }

  async onUpdate() {
    const { code, context, buffer, prevSource } = this.state;
    const prevWorklet = this.state.worklet;

    if (typeof buffer === 'undefined') {
      return;
    }

    if (typeof prevSource !== 'undefined') {
      prevSource.disconnect();
    }

    if (typeof prevWorklet !== 'undefined') {
      prevWorklet.disconnect();
    }

    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const processorName = `processor-${Math.random()}`
    const blob = new Blob([`
let _registerProcessor = registerProcessor;
let registered = false;

registerProcessor = (name, klass) => {
  if (!registered) {
    registered = true;
    _registerProcessor('${processorName}', klass);
    registerProcessor = _registerProcessor;
  }
};
` + code + `
if (typeof Processor !== 'undefined') {
  registerProcessor('${processorName}', Processor);
}
`], { type: 'application/javascript' });
    const blobURL = URL.createObjectURL(blob);

    try {
      await context.audioWorklet.addModule(blobURL);

      const worklet =
        // eslint-disable-next-line no-undef
        new AudioWorkletNode(
          context,
          processorName
        );

      source.connect(worklet).connect(context.destination);
      source.start(0);

      this.setState({
        error: null,
        worklet,
        prevSource: source
      });
    } catch (e) {
      this.setState({
        error: e.message
      });
    }

  }

  onChange(newValue, e) {
    this.setState({
      code: newValue
    });
  }

  onStop(newValue, e) {
    const { prevSource, worklet } = this.state;

    if (typeof prevSource !== 'undefined') {
      prevSource.disconnect();
    }

    if (typeof worklet !== 'undefined') {
      worklet.disconnect();
    }

    this.setState({
      prevSource: undefined,
      worklet: undefined
    });
  }

  async onSave() {
    const { code } = this.state;
    const formData = new FormData();

    formData.set('content', code);

    const res = await fetch('/api/w', {
      method: 'POST',
      body: formData
    });

    if (res.ok) {
      const data = await res.json();

      window.location.href = `/w/${data.item.id}`;
    }
  }

  render() {
    const {
      id,
      code,
      worklet,
      error,
      audioWorkletIsAvailable,
      ready
    } = this.state;

    const origin = new URL(window.location.href).origin;

    return (
      <div>
        <div className="App-header">
          <h1>
            <a href="/">AudioWorklet Playground</a>
          </h1>
          <div>
          </div>
        </div>
        <div className="App">
          <div className="App-editor">
            <MonacoEditor
              height="400"
              language="javascript"
              value={code}
              editorDidMount={this.editorDidMount.bind(this)}
              onChange={this.onChange.bind(this)}
              requireConfig={requireConfig}
              options={{
                autoIndent: true,
                automaticLayout: true,
                minimap:{
                  enabled: false
                }
              }}
            />
          </div>
          <div className="App-sidebar">
            { audioWorkletIsAvailable ||
              <div className="error">AudioWorklet is not available on this browser (<a href="https://developers.google.com/web/updates/2017/12/audio-worklet#experimental">how to enable</a>)</div>
            }
            { error &&
              <div className="error">{error}</div>
            }
            { audioWorkletIsAvailable && ready &&
              <div>
                <button
                  onClick={this.onUpdate.bind(this)}
                >Run</button>
                <button
                  onClick={this.onStop.bind(this)}
                >Stop</button>
                <button
                  onClick={this.onSave.bind(this)}
                >Save</button>
                <Worklet worklet={worklet} />
              </div>
            }
            { id &&
              <div className="App-usage">
                <p className="title">Usage Example</p>
                <pre>{`const context = new AudioContext();
await context
  .audioWorklet
  .addModule('${origin}/w/${id}/module.js');
const worklet =
  new AudioWorkletNode(
    context,
    'processor-${id}'
  );
`}</pre>
              </div>
            }
          </div>
        </div>
      </div>
    );
  }
}

export default App;
