import React from 'react';

const MockMapView = React.forwardRef((props, ref) => {
  return React.createElement('MapView', { ...props, ref }, props.children);
});

const MockMarker = (props) => {
  return React.createElement('Marker', props, props.children);
};

const MockPolygon = (props) => {
  return React.createElement('Polygon', props, props.children);
};

const MockPolyline = (props) => {
  return React.createElement('Polyline', props, props.children);
};

export default MockMapView;
export const Marker = MockMarker;
export const Polygon = MockPolygon;
export const Polyline = MockPolyline;
export const PROVIDER_GOOGLE = 'google'; 