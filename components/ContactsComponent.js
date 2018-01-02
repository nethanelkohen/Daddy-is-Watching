import React, { Component } from 'react';
import { View, Text, StyleSheet, Button, FlatList } from 'react-native';
import { Contacts } from 'expo';
import { List, ListItem } from 'react-native-elements';

export default class ContactsComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      contactSearch: null,
      contacts: null
    };
  }

  async showFirstContactAsync() {
    // Ask for permission to query contacts.
    const permission = await Expo.Permissions.askAsync(
      Expo.Permissions.CONTACTS
    );
    if (permission.status !== 'granted') {
      // Permission was denied...
      return;
    }
    const contacts = await Expo.Contacts.getContactsAsync({
      fields: [Expo.Contacts.PHONE_NUMBERS],
      pageSize: 1000,
      pageOffset: 0
    });
    const obj = [...contacts.data];
    const newContacts = obj.sort((a, b) => {
      let nameA = a.name;
      let nameB = b.name;
      if (nameA < nameB) return -1;
      // if (nameA > nameB) return 1;
    });
    this.setState({
      contacts: newContacts
    });
  }

  render() {
    const alphContacts = this.state.contacts;
    return (
      <View>
        <Button
          style={styles.button}
          title="Get Contacts"
          onPress={this.showFirstContactAsync.bind(this)}
        />
        {alphContacts ? (
          <FlatList
            data={alphContacts}
            renderItem={({ item }) => <ListItem title={item.name}/>}
            keyExtractor={(item, index) => index}
          />
        ) : null}
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