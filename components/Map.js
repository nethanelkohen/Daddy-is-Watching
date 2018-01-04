import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Platform,
  TextInput,
  Button,
  Picker,
  Alert,
  AsyncStorage
} from 'react-native';
import { MapView, Location, Permissions, Constants } from 'expo';
import Geocoder from 'react-native-geocoding';
import geolib from 'geolib';
import TextMessage from './TextMessage.js';

Geocoder.setApiKey('AIzaSyBakh5h7JIfXWWZmj-vm08iGO0pXUwV4Y4');

export default class Map extends Component {
  constructor(props) {
    super(props);
    this.state = {
      center: null,
      radius: 200,
      address: '',
      location: {},
      markers: [],
      contact: null,
      message: null,
      coordinate: {
        latitude: null,
        longitude: null
      },
      errorMessage: null
    };
    // this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentWillMount() {
    if (Platform.OS === 'android' && !Constants.isDevice) {
      this.setState({
        errorMessage: 'Oops, this will not work.'
      });
    } else {
      this._getLocationAsync();
    }
  }

  _getLocationAsync = async () => {
    let { status } = await Permissions.askAsync(Permissions.LOCATION);
    if (status !== 'granted') {
      this.setState({
        errorMessage: 'Address not found'
      });
    }

    let location = await Location.getCurrentPositionAsync({});
    this.setState({
      location,
      region: {
        ...location.coords,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421
      }
    });
  };

  handleAddress = text => {
    this.setState({ address: text });
  };

  getFromLocation = () => {
    Geocoder.getFromLocation(this.state.address).then(
      json => {
        const geoLocation = json.results[0].geometry.location;
        let id = 0;
        this.setState({
          markers: [
            ...this.state.markers,
            {
              coordinate: {
                longitude: geoLocation.lng,
                latitude: geoLocation.lat
              },
              key: `${id++}`
            }
          ]
        });
      },
      error => {
        Alert.alert(JSON.stringify(error));
      }
    );
  };

  onRegionChange(region) {
    this.setState({ region });
  }

  componentDidMount = async () => {
    try {
      this.state.contact = await AsyncStorage.getItem('contactChoice');
      this.state.message = await AsyncStorage.getItem('message');
      // console.log(`state: ${this.state.contact}`);
    } catch (error) {
      Alert.alert(JSON.stringify(error));
    }
  };

  howFar = async () => {
    let mark = this.state.markers;
    navigator.geolocation.getCurrentPosition(
      position => {
        mark.map(coord => {
          const distance = geolib.getDistance(position.coords, {
            latitude: coord.coordinate.latitude,
            longitude: coord.coordinate.longitude
          });
          if (distance < this.state.radius) {
            fetch('https://frozen-ridge-66479.herokuapp.com/message', {
              method: 'POST',
              headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                contact: this.state.contact,
                message: this.state.message
              })
            })
              .then(response => {
                console.log(response);
              })
              .done();
          }
        });
      },
      {
        enableHighAccuracy: true
      }
    );
  };

  render() {
    // console.log(this.state.contact, this.state.message);
    return (
      <View style={styles.container}>
        <TextInput
          style={styles.input}
          placeholder="Address"
          placeholderTextColor="#9a73ef"
          autoCapitalize="none"
          onChangeText={this.handleAddress}
        />
        <Button
          style={styles.button}
          title="go"
          onPress={this.getFromLocation}
        />
        <Button style={styles.button} title="how far" onPress={this.howFar} />
        <Picker
          selectedValue={this.state.radius}
          onValueChange={choice => this.setState({ radius: choice })}
        >
          <Picker.Item label="200" value={200} />
          <Picker.Item label="500" value={500} />
          <Picker.Item label="1000" value={1000} />
        </Picker>

        <MapView.Animated
          style={{ flex: 2 }}
          showsUserLocation={true}
          // followsUserLocation={true}
          showsCompass={true}
          region={this.state.region}
          onRegionChange={this.onRegionChange.bind(this)}
        >
          {/* coordinate={{
            latitude: marker.coordinate.latitude,
            longitude: marker.coordinate.longitude
          }}*/}
          {this.state.markers.map(marker => (
            <MapView>
              <MapView.Marker
                coordinate={marker.coordinate}
                title="Endpoint"
                key={marker.key}
              />
              <MapView.Circle
                center={marker.coordinate}
                radius={this.state.radius}
              />
            </MapView>
          ))}
        </MapView.Animated>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Constants.statusBarHeight,
    backgroundColor: '#ecf0f1'
  },
  paragraph: {
    margin: 10,
    fontSize: 10,
    textAlign: 'center'
  }
});
