import firebase from 'firebase/app'
import FileSaver from 'file-saver'
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

function exportData() {
    firebase.database().ref('/games')
        .once('value', gamesListSnap => {
            let data = []
            
            let i  = 1
            gamesListSnap.forEach(gameSnap => {
                let j = 1
                let dateString = gameSnap.child('date').val()

                gameSnap.child('guesses').forEach(guessSnap => {
                    let guess = guessSnap.val()
                    let k = 0
                    let times = []

                    while (guess[k]) {
                        times.push(guess[k].elapsedTime)
                        k++
                    }

                    times.reverse()
                    
                    data.push(`${i},${gameSnap.key},${guessSnap.key},${dateString},${guess.word},${j},${k},${times.join(',')}`)
                    j++
                })
                i++
            })
            data.push('prueba,game key,guess key,fecha,palabra,numero,cantidad de intentos,intento 1,intento 2,intento 3,intento 4,intento 5')
            data.reverse()
            data = data.join('\n')
            let blob = new Blob([data], {type: 'text/plain;charset=utf-8'})
            FileSaver.saveAs(blob, `${(new Date()).toJSON()}.csv`)
        })
}

$('#button-login-submit').click(doLogin)
$('#button-download').click(exportData)
