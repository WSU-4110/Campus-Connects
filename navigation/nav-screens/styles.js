import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Color palette 
export const COLORS = {
  primary: '#0C5449',
  secondary: '#808080',
  white: '#FFFFFF',
  black: '#000000',
  background: '#F5F5F5',
  text: '#333333',
  public: '#0C5449',
  private: '#8B0000',
};

// Typography
export const FONTS = {
  regular: 'Montserrat_400Regular',
  medium: 'Montserrat_500Medium',
  bold: 'Montserrat_700Bold',
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#E6E5E7',
    },
    topContent: {
      width: '100%',
      height: height * 0.3,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 0,
      position: 'relative',
      top: -50,
    },
    bannerImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'contain',
    },
    bannerText: {
      position: 'absolute',
      color: 'white',
      fontSize: 48,
      fontWeight: 'bold',
      fontFamily: 'Montserrat_600Semibold', 
      textAlign: 'center',
      center: 25,
    },
    bottomContent: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      fontFamily: 'Montserrat_400Regular', 
    },
    buttonContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      position: 'absolute',
      top: '50%',
      left: 25,
      right: 10,
    },
    button: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: 'white',
      borderRadius: 30,
      paddingVertical: 20,
      paddingHorizontal: 20,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      marginHorizontal: 5,
    },
    buttonText: {
      color: '#000',
      fontSize: 14,
      fontFamily: 'Montserrat_600Semibold',
      textAlign: 'center',
      marginLeft: 5,
    },
    icon: {
      marginRight: 5,
    },
    eventsScroll: {
      marginTop: 10,
    },
    eventsScrollContent: {
      paddingHorizontal: 15,
    },
    eventCard: {
      width: width * 0.85,
      height: 220,
      marginRight: 15,
      padding: 16,
      backgroundColor: 'white',
      borderRadius: 12,
  
    },
    eventTitle: {
      marginTop:5,
      fontSize: 16,
      fontWeight: '600',
      color: '#0C5449',
      marginBottom: 3,
      fontFamily: 'Montserrat_600SemiBold',
    },
    eventLocation: {
      color: 'grey',
      marginBottom: 0,
      marginTop: 0,
      fontFamily: 'Montserrat_400Regular',
      fontSize: 14,
    },
    eventTime: {
      color: 'grey',
      marginBottom: 3,
      fontFamily: 'Montserrat_400Regular',
      fontSize: 14,
    },
    eventDescription: {
      fontFamily: 'Montserrat_400Regular',
      fontSize: 14,
      marginBottom: 10,
      marginTop: 10,
      color: '#333',
      maxHeight: 75,
    },
    iconCircle: {
      marginRight: 20,
      width: 40,  
      height: 40, 
      borderRadius: 20, 
      backgroundColor: '#e0fae2', 
      alignItems: 'center', 
      justifyContent: 'center',
      overflow: 'hidden', 
    },
    iconCircle2: {
      width: 30,  
      height: 30, 
      borderRadius: 15, 
      backgroundColor: '#daedd6', 
      alignItems: 'center', 
      justifyContent: 'center',
      marginRight: 8, 
  
    },
    headerText: {
      fontSize: 18,
      fontFamily: 'Montserrat_600SemiBold',
      marginBottom: 5,
      marginLeft: 20,
    },
    fixedPosition: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 5,
    },
  
  linkText: {
    color: 'grey', 
    fontFamily: 'Montserrat_600Semibold',
    fontSize: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'left',
    marginLeft: 0,
    marginHorizontal: 20,
    marginTop: -75, 
    marginBottom: 0,
  },
  headerContainer2:{
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'left',
    marginLeft: 0,
    marginHorizontal: 20,
    marginTop: 30, 
    marginBottom: -10,
  
  },
  bookmarkContainer: {
    position: 'absolute', 
    bottom: 10, 
    right: 10,   
    backgroundColor: 'white',
    borderRadius: 50,
    width: 40, 
    height: 40, 
    justifyContent: 'center', 
    alignItems: 'center', 
    elevation: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center', 
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#E6E5E7',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '80%',
    maxHeight: '70%',
  },
  modalScrollContent: {
    paddingBottom: 20,
  },
  modalTitle: {
    fontFamily: 'Montserrat_600Semibold',
    fontSize: 20,
    marginBottom: 5,
    color: '#0C5449',
  },
  baseModalText: {
    fontSize: 14,
    marginBottom: 5,
    fontFamily: 'Montserrat_500Medium',
  },
  modalDescription: {
    fontSize: 14,
    marginTop: 5,
    fontFamily: 'Montserrat_400Regular',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'white',
    borderRadius: 50,
    width: 40, 
    height: 40, 
    justifyContent: 'center', 
    alignItems: 'center', 
    elevation: 2,
  },
  personalEventsContainer: {
    marginTop: 20,
  },
  personalEventsTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat_500Medium',
    color: '#0C5449',
    marginBottom: 10,
  },
  personalEventCard: {
    width: width * 0.85,
    height: 220,
    marginRight: 15,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  eventDate: {
    fontSize: 14,
    marginBottom: 0,
    fontFamily: 'Montserrat_400Regular',
    color: 'grey', 
  },
  eventsStatus:{
    marginTop: 10,
  },
  statusAndTagsContainer: {
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 10,
  },
  tagsContainer: {
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    marginLeft: 10, 
    
  },
  tag: {
    backgroundColor: '#acdfec',
    fontFamily: 'Montserrat_500Medium',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    marginRight: 5,
    fontSize: 14,
  },
  privateText: {
    color: 'black',           
    fontFamily: 'Montserrat_500Medium',
    backgroundColor: '#c3e4f5', 
    paddingHorizontal: 8,     
    paddingVertical: 4,        
    borderRadius: 20,           
    textAlign: 'center',        
    maxWidth: 90,              
  },
  publicText: {
    color: 'black',           
    fontFamily: 'Montserrat_500Medium',
    backgroundColor: '#fcd5df',     
    paddingHorizontal: 8,      
    paddingVertical: 4,       
    borderRadius: 20,        
    textAlign: 'center',    
    maxWidth: 90,         
  },
  headcountRow: {
    marginTop: 15,
    marginLeft: 5,
    flexDirection: 'row',  
    alignItems: 'center',      
    justifyContent: 'flex-start', 
  },
  registerButton: {
    backgroundColor: '#3b64a9',
    borderRadius: 10,
    padding: 8,
    elevation: 2,
    marginTop: 0,
  },
  registerButtonText: {
    color: 'white',
    fontFamily: 'Montserrat_600Semibold',
    textAlign: 'center',
  },
  });

// Export both the styles and color/font constants
export { styles };
// export const SIZES = {
//   width,
//   height,
//   // You can add more size-related constants
//   padding: 15,
//   margin: 10,
// };