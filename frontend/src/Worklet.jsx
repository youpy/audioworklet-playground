import React, { Component } from 'react';
import AudioParam from './AudioParam.jsx';

class Worklet extends Component {
  render() {
    const { worklet } = this.props;

    if (typeof worklet === 'undefined') {
      return null;
    }

    const parameters = worklet.parameters;
    const keys = [];

    for (let [key, value] of parameters) {
      keys.push([key, value]);
    }

    return (
      <div className="worklet">
        { keys.map(([key, param]) => (
          <AudioParam key={`${key}_${param.value}`} name={key} param={param} context={worklet.context} />
        ))}
      </div>
    );
  }
}

export default Worklet;
