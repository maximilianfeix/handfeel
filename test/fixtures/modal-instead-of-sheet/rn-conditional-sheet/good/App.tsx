import React from 'react';
import { Modal, View } from 'react-native';
const IS_IPAD = false;
export default () => <Modal presentationStyle={IS_IPAD ? 'formSheet' : 'pageSheet'}><View /></Modal>;
