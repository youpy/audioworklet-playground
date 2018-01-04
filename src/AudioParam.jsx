import React, { Component } from 'react';

class AudioParam extends Component {
  shouldComponentUpdate(nextProps, nextState) {
    return nextProps.param.value !== this.props.param.defaultValue;
  }

  render() {
    const { name, param, context } = this.props;

    if (typeof param === 'undefined') {
      return null;
    }

    return (
      <div>
        <label>
          <input
            type="range"
            defaultValue={param.defaultValue}
            step={0.01}
            min={param.minValue}
            max={param.maxValue}
            onInput={e => param.setValueAtTime(e.target.value, context.currentTime)}
          />
          {name}
        </label>
      </div>
    );
  }
}

export default AudioParam;
