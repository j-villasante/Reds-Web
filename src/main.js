import firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/database'

import config from './firebase.config.json'
firebase.initializeApp(config)

firebase.auth().onAuthStateChanged(user => {
    if (user) {
        handleStart()
    } else {
        $('#login-container').removeClass('d-none')
        $('#main-data').addClass('d-none')
    }
})

function doLogin () {
    let email = $('#input-login-email').val()
    let password = $('#input-login-password').val()
    firebase.auth().signInWithEmailAndPassword(email, password)
        .catch(error => {
            let errorMessage = error.message
            $('#login-alert').removeClass('d-none')
            $('#login-alert').text(errorMessage)
        })
}

function handleStart () {
    $('#login-container').remove()
    $('#main-data').removeClass('d-none')
    getData()
}

function getData () {
    firebase.database().ref('games/')
        .on('value', gamesListSnap => {
            let games = []
            gamesListSnap.forEach(gameSnap => {
                let game = {
                    date: gameSnap.child('date').val(),
                    guesses: []
                }
                gameSnap.child('guesses').forEach(guessSnap => {
                    let guess = guessSnap.val()
                    let tries = []
                    let i = 0
                    while (guess[i] && i < 20) {
                        tries.push(guess[i].elapsedTime)
                        i++
                    }
                    if (i === 20) tries.push('many more')
                    game.guesses.push({
                        word: guess.word,
                        tries: tries.reverse().join(' - ')
                    })
                })
                games.push(game)
            })
            games.reverse()
            $('table tbody').html(formatData(games))
        })
}

function formatData (games) {
    let html = ''
    for (let game of games) {
        let i = 1
        for (let guess of game.guesses) {
            let dateHtml
            if (i === 1) dateHtml = game.date
            else dateHtml = ''

            html += `<tr>
                <th scope="row">${i}</th>
                <td>${dateHtml}</td>
                <td>${guess.word}</td>
                <td>${guess.tries}</td>
            </tr>`
            i++
        }
    }
    return html
}

$('#button-login-submit').click(doLogin)
