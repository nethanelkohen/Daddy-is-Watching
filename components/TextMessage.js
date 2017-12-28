import Expo from 'expo';
import React, { Component } from 'react';
import { View, Text, StyleSheet, Button, TextInput } from 'react-native';
import axios from 'axios';
require('json-circular-stringify');

export default class TextMessage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      contact: null,
      message: null
    };
  }

  handleSubmit() {
    let contact = this.state.contact;
    let message = this.state.message;
    fetch('https://frozen-ridge-66479.herokuapp.com/message', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contact: contact,
        message: message
      })
    })
      .then(response => {
        console.log(response);
      })
      .done();
  }

  render() {
    return (
      <View>
        <TextInput
          style={styles.input}
          placeholder="Contact"
          placeholderTextColor="#9a73ef"
          autoCapitalize="none"
          onChangeText={text => this.setState({ contact: text })}
          value={this.state.contact}
        />
        <TextInput
          style={styles.input}
          placeholder="Message"
          placeholderTextColor="#9a73ef"
          autoCapitalize="none"
          onChangeText={text => this.setState({ message: text })}
          value={this.state.message}
        />
        <Button
          style={styles.button}
          title="Send Message"
          onPress={this.handleSubmit.bind(this)}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1
    // alignItems: 'center',
    // justifyContent: 'center',
  }
});