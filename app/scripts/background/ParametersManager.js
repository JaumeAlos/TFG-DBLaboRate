import ChromeStorage from '../utils/ChromeStorage'

class ParametersManager {
  init () {
    // Initialize replier for requests related to storage
    this.initRespondent()
  }

  initRespondent () {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.scope === 'parameterManager') {
        if (request.cmd === 'getNumberOfAuthorsParameter') {
          ChromeStorage.getData('parameters.numberOfAuthors', ChromeStorage.sync, (err, parameter) => {
            if (err) {
              sendResponse({ err: err })
            } else {
              if (parameter && parameter.data) {
                parameter = JSON.parse(parameter.data)
                sendResponse({ parameter: parameter || 3 })
              } else {
                sendResponse({ parameter: 3 })
              }
            }
          })
        } else if (request.cmd === 'setNumberOfAuthorsParameter') {
          let numberOfAuthorsParameter = request.data.numberOfAuthorsParameter
          ChromeStorage.setData('parameters.numberOfAuthors', { data: JSON.stringify(numberOfAuthorsParameter) }, ChromeStorage.sync, (err) => {
            if (err) {
              sendResponse({ err: err })
            } else {
              sendResponse({ parameter: numberOfAuthorsParameter })
            }
          })
        } else if (request.cmd === 'getCloseColleagueParameter') {
          ChromeStorage.getData('parameters.closeColleagueParameter', ChromeStorage.sync, (err, parameter) => {
            if (err) {
              sendResponse({ err: err })
            } else {
              if (parameter && parameter.data) {
                parameter = JSON.parse(parameter.data)
                sendResponse({ parameter: parameter || 3 })
              } else {
                sendResponse({ parameter: 3 })
              }
            }
          })
        } else if (request.cmd === 'setCloseColleagueParameter') {
          let closeColleagueParameter = request.data.closeColleagueParameter
          ChromeStorage.setData('parameters.closeColleagueParameter', { data: JSON.stringify(closeColleagueParameter) }, ChromeStorage.sync, (err) => {
            if (err) {
              sendResponse({ err: err })
            } else {
              sendResponse({ parameter: closeColleagueParameter })
            }
          })
        } else if (request.cmd === 'getCloseColleagueYearParameter') {
          ChromeStorage.getData('parameters.yearRangeCloseColleague', ChromeStorage.sync, (err, parameter) => {
            if (err) {
              sendResponse({ err: err })
            } else {
              if (parameter && parameter.data) {
                parameter = JSON.parse(parameter.data)
                sendResponse({ parameter: parameter || 4 })
              } else {
                sendResponse({ parameter: 4 })
              }
            }
          })
        } else if (request.cmd === 'setCloseColleagueYearParameter') {
          let yearRangeCloseColleague = request.data.yearRangeCloseColleague
          ChromeStorage.setData('parameters.yearRangeCloseColleague', { data: JSON.stringify(yearRangeCloseColleague) }, ChromeStorage.sync, (err) => {
            if (err) {
              sendResponse({ err: err })
            } else {
              sendResponse({ parameter: yearRangeCloseColleague })
            }
          })
        } else if (request.cmd === 'getAcquaintanceParameter') {
          ChromeStorage.getData('parameters.acquaintanceParameter', ChromeStorage.sync, (err, parameter) => {
            if (err) {
              sendResponse({ err: err })
            } else {
              if (parameter && parameter.data) {
                parameter = JSON.parse(parameter.data)
                sendResponse({ parameter: parameter || 3 })
              } else {
                sendResponse({ parameter: 3 })
              }
            }
          })
        } else if (request.cmd === 'setAcquaintanceParameter') {
          let acquaintanceParameter = request.data.acquaintanceParameter
          ChromeStorage.setData('parameters.acquaintanceParameter', { data: JSON.stringify(acquaintanceParameter) }, ChromeStorage.sync, (err) => {
            if (err) {
              sendResponse({ err: err })
            } else {
              sendResponse({ parameter: acquaintanceParameter })
            }
          })
        } else if (request.cmd === 'getAcquaintanceYearParameter') {
          ChromeStorage.getData('parameters.yearRangeAcquaintance', ChromeStorage.sync, (err, parameter) => {
            if (err) {
              sendResponse({ err: err })
            } else {
              if (parameter && parameter.data) {
                parameter = JSON.parse(parameter.data)
                sendResponse({ parameter: parameter || 5 })
              } else {
                sendResponse({ parameter: 5 })
              }
            }
          })
        } else if (request.cmd === 'setAcquaintanceYearParameter') {
          let yearRangeAcquaintance = request.data.yearRangeAcquaintance
          ChromeStorage.setData('parameters.yearRangeAcquaintance', { data: JSON.stringify(yearRangeAcquaintance) }, ChromeStorage.sync, (err) => {
            if (err) {
              sendResponse({ err: err })
            } else {
              sendResponse({ parameter: yearRangeAcquaintance })
            }
          })
        } else if (request.cmd === 'getLastAuthorshipPosition') {
          ChromeStorage.getData('parameters.lastAuthorshipPosition', ChromeStorage.sync, (err, parameter) => {
            if (err) {
              sendResponse({ err: err })
            } else {
              if (parameter && parameter.data) {
                parameter = JSON.parse(parameter.data)
                sendResponse({ parameter: parameter || 0 })
              } else {
                sendResponse({ parameter: 0 })
              }
            }
          })
        } else if (request.cmd === 'setLastAuthorshipPosition') {
          let lastAuthorshipPosition = request.data.lastAuthorshipPosition
          ChromeStorage.setData('parameters.lastAuthorshipPosition', { data: JSON.stringify(lastAuthorshipPosition) }, ChromeStorage.sync, (err) => {
            if (err) {
              sendResponse({ err: err })
            } else {
              sendResponse({ parameter: lastAuthorshipPosition })
            }
          })
        }
        return true
      }
    })
  }
}

export default ParametersManager
