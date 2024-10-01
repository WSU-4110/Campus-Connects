import React from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

const MapView: React.FC = () => {
  const mapHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { margin: 0; padding: 0; }
          #map { height: 100vh; width: 100%; }
        </style>
        <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyC72TPKKa3UCsdO6xWXUmRsIYDIdZObA6g"></script>
        <script>
          function initMap() {
            const location = { lat:42.35831729171249, lng: -83.07107881872119}; 
            const map = new google.maps.Map(document.getElementById("map"), {
              zoom: 17,
              center: location,
            });
            new google.maps.Marker({ position: location, map: map });
          }
        </script>
      </head>
      <body onload="initMap()">
        <div id="map"></div>
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html: mapHtml }}
        style={styles.map}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});

export default MapView;
