import React, { Component } from 'react';
import moment from "moment";

class UpdateButton extends Component {

  render() {
    const updated = moment(this.props.updated).fromNow();
    return (
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <p>{`Updated ${updated}`}</p>
        <button onClick={this.props.updateData}> Update Data </button>
      </div>
    );
  }
}

export default UpdateButton;
