class Options {
  init () {
    document.querySelector('#numberOfAuthorsParameterButton').addEventListener('click', () => {
      let currentValue = document.querySelector('#numberOfAuthorsParameterInput').value
      let messageLabel = document.querySelector('#numberOfAuthorsParameterMessage')
      if (this.checkNumberOfAuthorsParameter(currentValue)) {
        this.setNumberOfAuthorsParameter(currentValue, messageLabel)
      } else {
        messageLabel.innerHTML = 'Invalid parameter'
      }
    })

    // Query for the minimum years of close colleague
    document.querySelector('#closeColleagueParameterButton').addEventListener('click', () => {
      let currentValue = document.querySelector('#closeColleagueParameterInput').value
      let messageLabel = document.querySelector('#closeColleagueParameterMessage')
      if (this.checkCloseColleagueParameter(currentValue)) {
        this.setCloseColleagueParameter(currentValue, messageLabel)
      } else {
        messageLabel.innerHTML = 'Invalid parameter'
      }
    })

    // Query for the range years of close colleague
    document.querySelector('#closeColleagueYearsButton').addEventListener('click', () => {
      let currentValue = document.querySelector('#closeColleagueYearsInput').value
      let messageLabel = document.querySelector('#closeColleagueYearsMessage')
      if (this.checkCloseColleagueParameter(currentValue)) {
        this.setCloseColleagueYearParameter(currentValue, messageLabel)
      } else {
        messageLabel.innerHTML = 'Invalid parameter'
      }
    })

    // Query for the minimum years of acquaintance
    document.querySelector('#acquaintanceParameterButton').addEventListener('click', () => {
      let currentValue = document.querySelector('#acquaintanceParameterInput').value
      let messageLabel = document.querySelector('#acquaintanceParameterMessage')
      if (this.checkAcquaintanceParameter(currentValue)) {
        this.setAcquaintanceParameter(currentValue, messageLabel)
      } else {
        messageLabel.innerHTML = 'Invalid parameter'
      }
    })

    // Query for the range years of acquaintance
    document.querySelector('#acquaintanceYearsButton').addEventListener('click', () => {
      let currentValue = document.querySelector('#acquaintanceYearsInput').value
      let messageLabel = document.querySelector('#acquaintanceYearsMessage')
      if (this.checkAcquaintanceParameter(currentValue)) {
        this.setAcquaintanceYearParameter(currentValue, messageLabel)
      } else {
        messageLabel.innerHTML = 'Invalid parameter'
      }
    })

    chrome.runtime.sendMessage({ scope: 'parameterManager', cmd: 'getNumberOfAuthorsParameter' }, ({ parameter }) => {
      if (parameter && parameter !== '') {
        document.querySelector('#numberOfAuthorsParameterInput').value = parameter
      } else {
        document.querySelector('#numberOfAuthorsParameterInput').value = 3
        this.setNumberOfAuthorsParameter(3)
      }
    })

    chrome.runtime.sendMessage({ scope: 'parameterManager', cmd: 'getCloseColleagueParameter' }, ({ parameter }) => {
      if (parameter && parameter !== '') {
        document.querySelector('#closeColleagueParameterInput').value = parameter
      } else {
        document.querySelector('#closeColleagueParameterInput').value = 3
        this.setCloseColleagueParameter(3)
      }
    })

    chrome.runtime.sendMessage({ scope: 'parameterManager', cmd: 'getCloseColleagueYearParameter' }, ({ parameter }) => {
      if (parameter && parameter !== '') {
        document.querySelector('#closeColleagueYearsInput').value = parameter
      } else {
        document.querySelector('#closeColleagueYearsInput').value = 4
        this.setCloseColleagueYearParameter(4)
      }
    })

    chrome.runtime.sendMessage({ scope: 'parameterManager', cmd: 'getAcquaintanceParameter' }, ({ parameter }) => {
      if (parameter && parameter !== '') {
        document.querySelector('#acquaintanceParameterInput').value = parameter
      } else {
        document.querySelector('#acquaintanceParameterInput').value = 3
        this.setAcquaintanceParameter(3)
      }
    })
    chrome.runtime.sendMessage({ scope: 'parameterManager', cmd: 'getAcquaintanceYearParameter' }, ({ parameter }) => {
      if (parameter && parameter !== '') {
        document.querySelector('#acquaintanceYearsInput').value = parameter
      } else {
        document.querySelector('#acquaintanceYearsInput').value = 5
        this.setAcquaintanceYearParameter(5)
      }
    })
  }

  setNumberOfAuthorsParameter (numberOfAuthorsParameter, messageLabel) {
    chrome.runtime.sendMessage({
      scope: 'parameterManager',
      cmd: 'setNumberOfAuthorsParameter',
      data: {numberOfAuthorsParameter: numberOfAuthorsParameter}
    }, ({numberOfAuthorsParameter}) => {
      console.debug('setNumberOfAuthorsParameter ' + numberOfAuthorsParameter)
      if (messageLabel) {
        messageLabel.innerHTML = 'Value saved'
      }
    })
  }

  setCloseColleagueParameter (closeColleagueParameter, messageLabel) {
    chrome.runtime.sendMessage({
      scope: 'parameterManager',
      cmd: 'setCloseColleagueParameter',
      data: {closeColleagueParameter: closeColleagueParameter}
    }, ({closeColleagueParameter}) => {
      console.debug('setCloseColleagueParameter ' + closeColleagueParameter)
      if (messageLabel) {
        messageLabel.innerHTML = 'Value saved'
      }
    })
  }

  setCloseColleagueYearParameter (closeColleagueYearParameter, messageLabel) {
    chrome.runtime.sendMessage({
      scope: 'parameterManager',
      cmd: 'setCloseColleagueYearParameter',
      data: {yearRangeCloseColleague: closeColleagueYearParameter}
    }, ({closeColleagueYearParameter}) => {
      console.debug('setCloseColleagueYearParameter ' + closeColleagueYearParameter)
      if (messageLabel) {
        messageLabel.innerHTML = 'Value saved'
      }
    })
  }

  setAcquaintanceParameter (acquaintanceParameter, messageLabel) {
    chrome.runtime.sendMessage({
      scope: 'parameterManager',
      cmd: 'setAcquaintanceParameter',
      data: {acquaintanceParameter: acquaintanceParameter}
    }, ({acquaintanceParameter}) => {
      console.debug('setAcquaintanceParameter ' + acquaintanceParameter)
      if (messageLabel) {
        messageLabel.innerHTML = 'Value saved'
      }
    })
  }

  setAcquaintanceYearParameter (acquaintanceYearParameter, messageLabel) {
    chrome.runtime.sendMessage({
      scope: 'parameterManager',
      cmd: 'setAcquaintanceYearParameter',
      data: {acquaintanceParameter: acquaintanceYearParameter}
    }, ({acquaintanceYearParameter}) => {
      console.debug('setAcquaintanceYearParameter ' + acquaintanceYearParameter)
      if (messageLabel) {
        messageLabel.innerHTML = 'Value saved'
      }
    })
  }

  checkNumberOfAuthorsParameter (parameter) {
    if (parameter <= 10) {
      return true
    } else {
      return false
    }
  }

  checkCloseColleagueParameter (parameter) {
    if (parameter <= 10) {
      return true
    } else {
      return false
    }
  }

  checkAcquaintanceParameter (parameter) {
    if (parameter <= 10) {
      return true
    } else {
      return false
    }
  }
}

export default Options
