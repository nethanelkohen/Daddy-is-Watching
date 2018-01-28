// Import react and component from react library.
import React, { Component } from 'react';
// Import react native components.
import {
  StyleSheet,
  Text,
  View,
  Platform,
  TextInput,
  Alert,
  AsyncStorage,
  KeyboardAvoidingView,
  Keyboard
} from 'react-native';
// Import icon for UI display.
import { Icon } from 'react-native-elements';
// Import components from Expo.
import { MapView, Location, Permissions, Constants } from 'expo';
// Import Geocoder for address search.
import Geocoder from 'react-native-geocoding';
// Import geolib for distance calculation.
import geolib from 'geolib';
// Import api key form secure config file.
import config from '../config/config.json';

// Store base url globally for API server call.
const BASE_URL = 'https://frozen-ridge-66479.herokuapp.com';

// Set Geocoder API key from config file for address search API call.
Geocoder.setApiKey(config.GEOCODER_API);

// Create Map component.
class Map extends Component {
  // Create constructor and gain access to props and functions from parent.
  constructor(props) {
    super(props);
    // Create state.
    this.state = {
      address: '',
      location: {},
      markers: {},
      contact: null,
      message: null,
      radius: 200,
      coordinate: {
        latitude: null,
        longitude: null
      },
      errorMessage: null,
      press: false
    };
  }

  // Instantiate React life cycle method to check user's device -- app will not
  // run on Android. Platform will be checked as soon as the
  // component loads.
  componentWillMount() {
    if (Platform.OS === 'android' && !Constants.isDevice) {
      // Fills out error message if user is on Android.
      this.setState({
        errorMessage: 'Oops, this will not work.'
      });
      // If user is on iOS, app gets user's location.
    } else {
      this._getLocationAsync();
    }
  }

  // Async func that first asks user permission to grab device location.
  _getLocationAsync = async () => {
    let { status } = await Permissions.askAsync(Permissions.LOCATION);
    // If user denies permission, then error message is filled out.
    if (status !== 'granted') {
      this.setState({
        errorMessage: 'Address not found'
      });
    }

    // Stores location with user's current location.
    let location = await Location.getCurrentPositionAsync({});
    // Sets state for user location with user's region (what is displayed on the map)
    // and location coordinates. latitudeDelta and longitudeDelta sets map zoom.
    this.setState({
      location,
      region: {
        ...location.coords,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421
      }
    });
  };

  // Takes in user's address search from TextInput and sets state for address
  // for Geocoder API call.
  handleAddress = text => {
    this.setState({ address: text });
  };

  // Gets Geocoder address search result.
  getFromLocation = () => {
    // Dismisses keyboard.
    Keyboard.dismiss();
    // Geocoder gets location user's address search then stores the result to
    // geoLocation variable.
    Geocoder.getFromLocation(this.state.address).then(
      json => {
        const geoLocation = json.results[0].geometry.location;
        let id = 0;
        // Sets state for map markers and moves map region to the geoLocation variable.
        this.setState({
          markers: {
            longitude: geoLocation.lng,
            latitude: geoLocation.lat
          },
          region: {
            longitude: geoLocation.lng,
            latitude: geoLocation.lat
          }
        });
      },
      // Handles error.
      error => {
        Alert.alert('Type in an address.');
      }
    );
  };

  // Handles region change on map, ie if user moves to a different point on map screen.
  onRegionChange(region) {
    // Sets new region state.
    this.setState({ region });
  }

  // Handles tracking function.
  beginTracking = async () => {
    // Alerts user to search for an address if there is no address entered.
    if (!this.state.address) {
      Alert.alert('Enter an address first.');
      // Does not change color of Begin Tracking UI component.
      this.setState({
        press: false
      });
    }
    // If user has search for address then..
    if (this.state.address) {
      // Changes color of Begin Tracking UI component.
      this.setState({
        press: true
      });
    }
    // Begins async twilio API call.
    try {
      // Grabs user's contact choice from async storage.
      AsyncStorage.getItem('contactChoice').then(digits => {
        // Sets user contact phone number digits to contact state.
        this.setState({
          contact: digits
        });
      });
      // Grabs user's message from async storage.
      AsyncStorage.getItem('message').then(userMessage => {
        // Sets user message to message state.
        this.setState({
          message: userMessage
        });
      });
      // Catches error if contact or message has not been selected.
    } catch (error) {
      Alert.alert(JSON.stringify(error));
    }
    let mark = this.state.markers;
    // Calculates distance from marker coordinate to user's current location.
    navigator.geolocation.getCurrentPosition(
      position => {
        // Stores distance in meters to distance variable.
        const distance = geolib.getDistance(position.coords, {
          latitude: mark.latitude,
          longitude: mark.longitude
        });
        // If distance variable is less than the radius (200 meters), then
        // mesage will be sent. ie, if user is within 200 meters of their endpoint
        // then message is sent.
        if (distance < this.state.radius) {
          this.sendMessage();
          console.log('once');
        }
      },
      // enableHighAccuracy for higher accuracy with geolib package.
      {
        enableHighAccuracy: true
      }
    );
  };

  // Handles Twilio API post request through our backend server.
  sendMessage = async () => {
    try {
      // Fetch post request to app's server.
      await fetch(`${BASE_URL}/message`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        // Body of post request takes in user's contact choice and message.
        body: JSON.stringify({
          contact: this.state.contact,
          message: this.state.message
        })
      });
      // Catches error.
    } catch (e) {
      console.log(e);
      // Sends message to user to confirm that their message was delivered.
    } finally {
      Alert.alert('Message was sent!');
    }
  };

  // Kills all functionality if user wants to cancel message.
  killSwitch = () => {
    this.setState({ contact: null, message: null, press: false });
  };

  // Render React elements to device.
  render() {
    return (
      <KeyboardAvoidingView behavior="padding" style={styles.keyboard}>
        <View style={styles.MapNavContainer}>
          {/* Text input from react native component used to record what user
            types for address search. */}
          <TextInput
            style={styles.AddressInput}
            placeholder="Where are you going?"
            controlled={true}
            multiline={false}
            placeholderTextColor="black"
            autoCapitalize="none"
            returnKeyType="search"
            onChangeText={this.handleAddress}
          />
          <View style={styles.IconTextBar}>
            <Text style={styles.IconText}>Search</Text>
            <Text style={styles.IconText}>Track Me</Text>
            <Text style={styles.IconText}>Cancel</Text>
          </View>
          <View style={styles.NavBoxContainer}>
            {/* Renders icons from react-native-elements for easier UI display.
              Icons used to fire getFromLocation, beginTracking and killSwitch. */}
            <Icon
              style={styles.Icon}
              name="search"
              type="feather"
              color="#517fa4"
              raised={true}
              onPress={this.getFromLocation}
            />
            <Icon
              style={styles.Icon}
              name="target"
              type="feather"
              // Changes color of icon if press state is true
              color={!this.state.press ? '#517fa4' : '#a45156'}
              raised={true}
              onPress={this.beginTracking}
            />
            <Icon
              style={styles.Icon}
              name="cancel"
              type="materialCommunityIcons"
              color="#517fa4"
              raised={true}
              onPress={this.killSwitch}
            />
          </View>
          {/* Renders map from react-native-maps (through Expo). */}
          <MapView.Animated
            style={{ flex: 6 }}
            showsUserLocation={true}
            followsUserLocation={false}
            showsCompass={true}
            region={this.state.region}
            onRegionChange={this.onRegionChange.bind(this)}
          >
            {/* Renders markers on map. */}
            <MapView.Marker coordinate={this.state.markers} title="Endpoint" />
            {/* Renders an (invisible) radius on map for geolocation purposes. */}
            <MapView.Circle
              // center={marker.coordinate}
              radius={this.state.radius}
            />
          </MapView.Animated>
        </View>
      </KeyboardAvoidingView>
    );
  }
}

const styles = StyleSheet.create({
  MapNavContainer: {
    flex: 1,
    backgroundColor: 'white'
  },
  IconText: {
    justifyContent: 'flex-start',
    flexDirection: 'row',
    marginTop: 0,
    fontSize: 17
  },
  Icon: {
    justifyContent: 'flex-start',
    flexDirection: 'row',
    marginTop: 0
  },
  IconTextBar: {
    justifyContent: 'space-around',
    flexDirection: 'row',
    marginTop: 0
  },
  NavBoxContainer: {
    flex: 1,
    justifyContent: 'space-around',
    flexDirection: 'row'
  },

  AddressInput: {
    flex: 1,
    backgroundColor: 'white',
    padding: 2,
    fontSize: 18,
    borderRadius: 10,
    fontSize: 20,
    alignSelf: 'stretch',
    marginTop: 0,
    borderWidth: 0.5
  },
  keyboard: {
    flex: 1,
    justifyContent: 'space-between'
  }
});

export default Map;
