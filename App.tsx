import {
  createPhantom,
  LoginOptions,
  PhantomConfig,
} from '@phantom/react-native-wallet-sdk';
import {
  View,
  StyleSheet,
  Button,
  Alert,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Text,
  ScrollView,
  Animated,
  Linking,
} from 'react-native';
import {useState, useRef, useEffect} from 'react';
import createTransferTransactionV0 from './createTransferTransactionV0';
import sendTransactionPhantomProvider from './createEthTransaction';
import {Connection, PublicKey} from '@solana/web3.js';

// Add initial console log to verify logging works
console.log('App is initializing...');

const opts: PhantomConfig = {
  redirectURI: 'awesomeproject://',
  sdkKey: 'my-sdk-key',
};

const phantom = createPhantom(opts);

export default function App() {
  const [addresses, setAddresses] = useState<any[] | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const heightAnim = useRef(new Animated.Value(0)).current;

  const handleDeepLink = (url: string) => {
    console.warn('🔗 DEEP LINK RECEIVED:', url);
    
    try {
      // Parse the URL
      const parsedUrl = new URL(url);
      console.warn('📎 Parsed URL:', {
        protocol: parsedUrl.protocol,
        hostname: parsedUrl.hostname,
        pathname: parsedUrl.pathname,
        searchParams: Object.fromEntries(parsedUrl.searchParams.entries())
      });

      // Show an Alert to make it more visible
      Alert.alert(
        'Deep Link Received',
        `Received URL: ${url}`,
        [{text: 'OK'}]
      );
    } catch (error) {
      console.warn('Error parsing URL:', error);
    }
  };

  useEffect(() => {
    console.log('Setting up deep link listeners...');
    
    // Log the URL scheme we're using
    console.log('URL Scheme: awesomeproject://');

    // Handle deep links when app is already running
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    // Handle deep links when app is launched from a link
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.warn('🚀 App launched with URL:', url);
        handleDeepLink(url);
      } else {
        console.log('No initial URL received');
      }
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.remove();
    };
  }, []);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    Animated.timing(heightAnim, {
      toValue: isExpanded ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const handleLoginWithGoogle = async () => {
    console.log('handleLoginWithGoogle');
    try {
      const addresses = await phantom.loginWithGoogle();
      setAddresses(addresses);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleLoginWithApple = async () => {
    const addresses = await phantom.loginWithApple();
    setAddresses(addresses);
  };

  // Sign a message or transaction with the Phantom Embedded wallet
  const handleSignMessage = async () => {
    const {signature} = await phantom.providers.solana.signMessage(
      new TextEncoder().encode('Hello, world!'),
    );
    Alert.alert('Signature', JSON.stringify(signature));
  };

  const handleSignTransaction = async () => {
    if (!addresses || addresses.length === 0) return;
    const transaction = await createTransferTransactionV0(
      new PublicKey(addresses[0].solana),
      new Connection('https://api.mainnet-beta.solana.com'),
    );
    const signedTransaction = await phantom.providers.solana.signTransaction(
      transaction,
    );
    Alert.alert('Signature', JSON.stringify(signedTransaction.serialize()));
  };

  const handleSendEthTransaction = async () => {
    if (!addresses || addresses.length === 0) return;
    try {
      const result = await sendTransactionPhantomProvider(
        phantom.providers.ethereum,
        addresses[0].evm,
        'ethereum',
        addresses[0].evm,
      );
      Alert.alert('Transaction Hash', JSON.stringify(result));
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleLogout = async () => {
    await phantom.logout();
    setAddresses(null);
  };

  const handleDismissBrowserIn10Seconds = async () => {
    setTimeout(() => {
      phantom.dismissBrowser();
    }, 10_000);
  };

  if (!addresses) {
    return (
      <View style={styles.container}>
        <Button
          title="Login with Phantom"
          onPress={() => setIsModalVisible(true)}
        />
        {isModalVisible && (
          <View>
            <Modal
              visible={isModalVisible}
              transparent={true}
              animationType="slide"
              onRequestClose={() => setIsModalVisible(false)}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  justifyContent: 'flex-end',
                }}
                activeOpacity={1}
                onPress={() => setIsModalVisible(false)}>
                <TouchableWithoutFeedback>
                  <View
                    style={{
                      backgroundColor: '#181818',
                      borderTopLeftRadius: 20,
                      borderTopRightRadius: 20,
                      width: '100%',
                    }}>
                    <LoginOptions
                      onGoogleLogin={() => handleLoginWithGoogle()}
                      onAppleLogin={() => handleLoginWithApple()}
                    />
                  </View>
                </TouchableWithoutFeedback>
              </TouchableOpacity>
            </Modal>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.addressContainer}>
        {addresses && addresses[0] && (
          <View>
            <TouchableOpacity style={styles.addressItem} onPress={toggleExpand}>
              <View style={styles.chainItem}>
                <Text style={styles.chainText}>Solana Address</Text>
                <Text style={styles.addressText}>
                  {String(addresses[0].solana)}
                </Text>
                <Text style={styles.expandText}>
                  {isExpanded ? 'Show less' : 'Show all chains'}
                </Text>
              </View>
            </TouchableOpacity>

            <Animated.View
              style={[
                styles.expandedContainer,
                {
                  maxHeight: heightAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 500],
                  }),
                  opacity: heightAnim,
                },
              ]}>
              {Object.entries(addresses[0])
                .filter(([chain]) => chain !== 'solana')
                .map(([chain, address]) => (
                  <View key={chain} style={styles.chainItem}>
                    <Text style={styles.chainText}>Chain: {chain}</Text>
                    <Text style={styles.addressText}>
                      Address: {String(address)}
                    </Text>
                  </View>
                ))}
            </Animated.View>
          </View>
        )}
      </View>
      <View style={styles.buttonContainer}>
        <Button title="Sign Message" onPress={handleSignMessage} />
        <Button
          title="Sign Solana Transaction"
          onPress={handleSignTransaction}
        />
        <Button
          title="Send ETH Transaction"
          onPress={handleSendEthTransaction}
        />
        <Button title="Logout" onPress={handleLogout} />
        <Button
          title="Dismiss Browser in 10 seconds"
          onPress={handleDismissBrowserIn10Seconds}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressContainer: {
    width: '100%',
    padding: 20,
  },
  addressItem: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 10,
  },
  expandedContainer: {
    backgroundColor: '#333',
    marginTop: 1,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    overflow: 'hidden',
  },
  chainItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  chainText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  addressText: {
    color: '#fff',
    fontSize: 14,
  },
  expandText: {
    color: '#4a9eff',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    padding: 20,
  },
});
