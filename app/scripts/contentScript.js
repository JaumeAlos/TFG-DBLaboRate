import AuthorPositionChart from './charts/AuthorPositionChart.js'
import AuthorCount from './charts/AuthorCount.js'
import AuthorCollaborations from './charts/AuthorCollaborations.js'

const loadPage = function () {
  console.log('page loaded')
  let author = document.getElementById('headline')
  console.log('author: ' + author.dataset.name)
  if (!window.dblpExtension) {
    window.dblpExtension = {}
  }
  let url = window.location.href
  const updatedURL = url.replace(/\.html$/, '.xml')
  fetch(updatedURL)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }
      return response.text()
    })
    .then(xmlData => {
      // Handle the XML data here
      const parser = new DOMParser()
      let xmlDoc = parser.parseFromString(xmlData, 'application/xml')

      chrome.runtime.sendMessage({ scope: 'parameterManager', cmd: 'getCloseColleagueParameter' }, ({ parameter }) => {
        let closeColleagueParameter
        if (parameter && parameter !== '') {
          closeColleagueParameter = parameter
        } else {
          closeColleagueParameter = 3
        }
        chrome.runtime.sendMessage({ scope: 'parameterManager', cmd: 'getCloseColleagueYearParameter' }, ({ parameter }) => {
          let closeColleagueYearParameter
          if (parameter && parameter !== '') {
            closeColleagueYearParameter = parameter
          } else {
            closeColleagueYearParameter = 3
          }
          chrome.runtime.sendMessage({ scope: 'parameterManager', cmd: 'getAcquaintanceParameter' }, ({ parameter }) => {
            let acquaintanceParameter
            if (parameter && parameter !== '') {
              acquaintanceParameter = parameter
            } else {
              acquaintanceParameter = 3
            }
            chrome.runtime.sendMessage({ scope: 'parameterManager', cmd: 'getAcquaintanceYearParameter' }, ({ parameter }) => {
              let acquaintanceYearParameter
              if (parameter && parameter !== '') {
                acquaintanceYearParameter = parameter
              } else {
                acquaintanceYearParameter = 3
              }
              chrome.runtime.sendMessage({ scope: 'parameterManager', cmd: 'getNumberOfAuthorsParameter' }, ({ parameter }) => {
                let numberOfAuthorsParameter
                if (parameter && parameter !== '') {
                  numberOfAuthorsParameter = parameter
                } else {
                  numberOfAuthorsParameter = 3
                }
                window.dblpExtension.authorCount = new AuthorCount()
                window.dblpExtension.authorCount.init(xmlDoc, numberOfAuthorsParameter)
                chrome.runtime.sendMessage({
                  scope: 'parameterManager',
                  cmd: 'getLastAuthorshipPosition'
                }, ({ parameter }) => {
                  let lastAuthorshipPosition
                  if (parameter && parameter !== '') {
                    lastAuthorshipPosition = parameter
                  } else {
                    lastAuthorshipPosition = false
                  }
                  window.dblpExtension.authorPositionChart = new AuthorPositionChart()
                  window.dblpExtension.authorPositionChart.init(xmlDoc, lastAuthorshipPosition)

                  window.dblpExtension.authorCollaborations = new AuthorCollaborations()
                  window.dblpExtension.authorCollaborations.init(xmlDoc, closeColleagueParameter, closeColleagueYearParameter, acquaintanceParameter, acquaintanceYearParameter, window.dblpExtension.authorCount, window.dblpExtension.authorPositionChart, numberOfAuthorsParameter, lastAuthorshipPosition)
                })
              })
            })
          })
        })
      })
    })
    .catch(error => {
      console.error('Error:', error)
    })
}

window.onload = loadPage
