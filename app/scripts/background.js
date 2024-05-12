import ParametersManager from './background/ParametersManager'

class Background {
  init () {
    // Initialize LLM manager
    this.parametersManager = new ParametersManager()
    this.parametersManager.init()
  }
}

const background = new Background()
background.init()
