import {
    ADD_QUESTION,
    ADD_QUESTION_FAILED,
    ADD_QUESTION_SUCCESS,
    QUESTION_FETCH_SUCCESS,
    QUESTION_ADDING,

    FORM_UPDATE,

    IMAGE_CANCEL,
    IMAGE_ERROR,
    IMAGE_SUCCESS,
    IMAGE_LOADING
} from './types';

import { Platform,Alert } from 'react-native'
import firebase from 'firebase';
import { Actions } from 'react-native-router-flux';
import ImagePicker from 'react-native-image-picker'
import RNFetchBlob from 'react-native-fetch-blob'

const Blob = RNFetchBlob.polyfill.Blob
const fs = RNFetchBlob.fs
window.XMLHttpRequest = RNFetchBlob.polyfill.XMLHttpRequest
window.Blob = Blob

export const updateForm = (value) => {
    return {
        type: FORM_UPDATE,
        payload: FORM_UPDATE
    }
}


export const addQuestion = (data) => {
    const { subjectCode, exam, semester, year } = data.value
    return (dispatch) => {
        dispatch({
            type: QUESTION_ADDING
        })

        uploadImage(data.url).then(url => {
            firebase.database().ref(`/questions/`)
                .push({ subjectCode, exam, semester, year, url })
                .then(() => {
                    dispatch({
                        type: ADD_QUESTION
                    })
                   Alert.alert("Success","Question added successfully!", [
                        { text: 'Back To Home', onPress: () => Actions.home({ type: 'reset' }) },
                    ], )

                }).catch((e) => {
                    console.log(e)
                    dispatch({
                        type: ADD_QUESTION_FAILED
                    })
                })
        })

    }


}

var options = {
    title: 'Select Question',
    storageOptions: {
        skipBackup: true,
        path: 'images'
    }
};

export const selectImage = () => {
    return (dispatch) => {
        ImagePicker.launchImageLibrary(options, (response) => {
            dispatch({
                type: IMAGE_LOADING
            })
            if (response.didCancel) {
                console.log('User cancelled image picker');

            }
            else if (response.error) {
                dispatch({
                    type: IMAGE_ERROR
                })
            }
            else {
                let source = response.uri
                let image_data = 'data:image/jpeg;base64,' + response.data
                dispatch({
                    type: IMAGE_SUCCESS,
                    payload: { source, image_data }
                })
            }
        })
    }
}


const uploadImage = (uri, mime = 'application/octet-stream') => {
    return new Promise((resolve, reject) => {
        const uploadUri = Platform.OS === 'ios' ? uri.replace('file://', '') : uri
        const sessionId = new Date().getTime()
        let uploadBlob = null
        const imageRef = firebase.storage().ref('images').child(`${sessionId}`)

        fs.readFile(uploadUri, 'base64')
            .then((data) => {
                return Blob.build(data, { type: `${mime};BASE64` })
            })
            .then((blob) => {
                uploadBlob = blob
                return imageRef.put(blob, { contentType: mime })
            })
            .then(() => {
                uploadBlob.close()
                return imageRef.getDownloadURL()
            })
            .then((url) => {
                resolve(url)
            })
            .catch((error) => {
                reject(error)
            })
    })
}