import Chart from 'chart.js/auto'
import XLSX from 'xlsx'

class AuthorCollaborations {
  constructor () {
    this.myChartCollaborator = null
    this.myLargeChartCollaborator = null
    this.myChartAcquaintance = null
    this.myLargeChartAcquaintance = null
    this.configuration = null
    this.publications = null
    this.specificAuthor = null
    this.closeColleagueParameter = 0
    this.acquaintanceParameter = 0
    this.yearRangeCloseColleague = 0
    this.yearRangeAcquaintance = 0
    this.initEventListeners()
  }

  async init (xmlDoc, closeColleagueParameter, yearRangeCloseColleague, acquaintanceParameter, yearRangeAcquaintance) {
    try {
      const result = xmlDoc
      this.publications = result.querySelectorAll('dblpperson > r')
      this.specificAuthor = result.querySelector('dblpperson > person > author').textContent
      this.acquaintanceParameter = acquaintanceParameter
      this.closeColleagueParameter = closeColleagueParameter
      this.yearRangeCloseColleague = yearRangeCloseColleague
      this.yearRangeAcquaintance = yearRangeAcquaintance

      const initialFilters = {
        'informal': true,
        'data': true,
        'editor': true,
        'incollection': true,
        'inproceedings': true,
        'article': true
      }
      const categorizedCoAuthors = this.countCoAuthors(this.publications || [], this.specificAuthor, initialFilters)
      await this.createAcquaintanceChart(categorizedCoAuthors)
      await this.createCollaboratorChart(categorizedCoAuthors)
    } catch (error) {
      console.error('An error occurred:', error)
    }
  }

  countCoAuthors (publications, specificAuthor, filters) {
    const publicationsByCoAuthors = {}
    const coAuthorsByYear = {}

    Array.from(publications).forEach(publication => {
      let pubType

      switch (publication.children[0].tagName) {
        case 'article':
          pubType = publication.children[0].getAttribute('publtype') === 'informal' ? 'informal' : 'article'
          break
        case 'inproceedings':
        case 'proceedings':
          pubType = 'inproceedings'
          break
        case 'editor':
          pubType = 'editor'
          break
        case 'data':
          pubType = 'data'
          break
        case 'incollection':
          pubType = 'incollection'
          break
      }

      if (filters[pubType]) {
        let authors = Array.from(publication.children[0].children)
          .filter(element => element.tagName === 'author')
          .map(author => author.textContent)
        let yearElement = Array.from(publication.children[0].children)
          .find(element => element.tagName === 'year')

        if (yearElement) {
          let year = parseInt(yearElement.innerHTML)
          authors = authors.filter(authorName => authorName !== specificAuthor)
          authors.forEach(authorName => {
            if (!publicationsByCoAuthors[authorName]) {
              publicationsByCoAuthors[authorName] = {}
            }
            if (!publicationsByCoAuthors[authorName][year]) {
              publicationsByCoAuthors[authorName][year] = []
            }
            publicationsByCoAuthors[authorName][year].push(publication)

            if (!coAuthorsByYear[year]) {
              coAuthorsByYear[year] = new Set()
            }
            coAuthorsByYear[year].add(authorName)
          })
        }
      }
    })

    // Define helper functions for categorization
    const isCloseColleague = (coAuthor, year) => {
      const years = Object.keys(publicationsByCoAuthors[coAuthor]).map(Number)
      return years.filter(y => y >= year - this.yearRangeCloseColleague && y <= year).length >= this.closeColleagueParameter
    }

    const isAcquaintance = (coAuthor, year) => {
      const years = Object.keys(publicationsByCoAuthors[coAuthor]).map(Number)
      let count = 0
      for (let y = year - this.yearRangeAcquaintance; y <= year; y++) {
        if (years.includes(y)) {
          count++
          if (count >= (this.acquaintanceParameter - 1)) return true
        }
      }
      return false
    }

    const isCollaborator = (coAuthor, year) => {
      const years = Object.keys(publicationsByCoAuthors[coAuthor]).map(Number)
      return Math.min(...years) === parseInt(year)
    }

    // Categorize each co-author for each year
    const categorizedCoAuthors = {}
    Object.keys(coAuthorsByYear).forEach(year => {
      categorizedCoAuthors[year] = { closeColleague: 0, acquaintance: 0, collaborator: 0 }
      coAuthorsByYear[year].forEach(coAuthor => {
        if (isCloseColleague(coAuthor, year)) {
          categorizedCoAuthors[year].closeColleague++
        } else if (isAcquaintance(coAuthor, year)) {
          categorizedCoAuthors[year].acquaintance++
        } else if (isCollaborator(coAuthor, year)) {
          categorizedCoAuthors[year].collaborator++
        }
      })
    })

    return categorizedCoAuthors
  }

  async initEventListeners () {
    const checkAndBind = () => {
      // Lista de IDs de todos los checkboxes de filtro
      const filterIds = [
        'show-informal', 'show-data', 'show-editor',
        'show-incollection', 'show-inproceedings', 'show-article'
      ]

      filterIds.forEach(id => {
        const checkbox = document.getElementById(id)
        if (checkbox) {
          checkbox.addEventListener('change', this.handleFilterChange.bind(this))
        }
      })
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', checkAndBind)
    } else {
      checkAndBind()
    }
  }

  async handleFilterChange (event) {
    const filters = {}
    const filterIds = [
      'show-informal', 'show-data', 'show-editor',
      'show-incollection', 'show-inproceedings', 'show-article'
    ]

    // Llenar el objeto de filtros con el estado actual de cada checkbox
    filterIds.forEach(id => {
      const checkbox = document.getElementById(id)
      if (checkbox) {
        filters[checkbox.id.replace('show-', '')] = checkbox.checked
      }
    })

    const categorizedCoAuthors = this.countCoAuthors(this.publications || [], this.specificAuthor, filters)
    await this.createAcquaintanceChart(categorizedCoAuthors)
    await this.createCollaboratorChart(categorizedCoAuthors)
  }

  async prepareDataForExcelCollaborators (categorizedCoAuthors) {
    return Object.keys(categorizedCoAuthors).map(year => ({
      Year: year,
      CloseColleagues: categorizedCoAuthors[year].closeColleague,
      Collaborators: categorizedCoAuthors[year].collaborator
    }))
  }

  async prepareDataForExcelAcquaintances (categorizedCoAuthors) {
    return Object.keys(categorizedCoAuthors).map(year => ({
      Year: year,
      CloseColleagues: categorizedCoAuthors[year].closeColleague,
      Acquaintances: categorizedCoAuthors[year].acquaintance
    }))
  }

  async exportToExcelCollaborators (categorizedCoAuthors) {
    const data = this.prepareDataForExcelCollaborators(categorizedCoAuthors)
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'CoAuthor Categories')
    XLSX.writeFile(workbook, 'Close_Colleagues_&_Collaborators.xlsx')
  }

  async exportToExcelAcquaintances (categorizedCoAuthors) {
    const data = this.prepareDataForExcelAcquaintances(categorizedCoAuthors)
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'CoAuthor Categories')
    XLSX.writeFile(workbook, 'Close_Colleagues_&_Acquaintances.xlsx')
  }

  // Function to create and save the chart
  async createAcquaintanceChart (categorizedCoAuthors) {
    const sortedYears = Object.keys(categorizedCoAuthors).sort((a, b) => a - b)

    const datasets = [
      {
        label: 'Close Colleagues',
        data: sortedYears.map(year => categorizedCoAuthors[year].closeColleague),
        backgroundColor: 'rgba(255, 99, 132)',
        stack: 'stacked'
      },
      {
        label: 'Acquaintances',
        data: sortedYears.map(year => categorizedCoAuthors[year].acquaintance),
        backgroundColor: 'rgba(54, 162, 235)',
        stack: 'stacked'
      }
    ]

    this.configuration = {
      type: 'bar',
      data: {
        labels: sortedYears,
        datasets: datasets
      },
      options: {
        scales: {
          x: {
            stacked: true
          },
          y: {
            stacked: true,
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            align: 'start'
          }
        }
      }
    }

    let normalCanvas = document.getElementById('myChartAcquaintances')
    const div = document.getElementById('authorpage-refine')
    const largeCanvas = document.createElement('canvas')

    if (!normalCanvas) {
      normalCanvas = document.createElement('canvas')
      normalCanvas.id = 'myChartAcquaintances'
      normalCanvas.width = 800
      normalCanvas.height = 600

      largeCanvas.id = 'myLargeChartAcquaintances'
      largeCanvas.width = 1100
      largeCanvas.height = 700
    } else {
      const normalCtx = normalCanvas.getContext('2d')
      if (this.myChartAcquaintance) {
        this.myChartAcquaintance.destroy()
      }
      normalCtx.clearRect(0, 0, normalCanvas.width, normalCanvas.height)
    }

    normalCanvas.addEventListener('click', () => {
      this.toggleChartModal(normalCanvas, largeCanvas, categorizedCoAuthors, true)
    })

    const previousTitle = document.getElementById('acquaintance-title')
    if (previousTitle) {
      previousTitle.remove()
    }

    const previousButton = document.getElementById('export-button-acquaintance')
    if (previousButton) {
      previousButton.remove()
    }

    const title = document.createElement('p')
    title.id = 'acquaintance-title'
    const text = document.createElement('b')
    text.innerHTML = 'Close Colleagues & Acquaintance'
    title.appendChild(text)
    div.insertBefore(normalCanvas, div.firstChild)
    div.insertBefore(title, normalCanvas)

    const exportButton = document.createElement('button')
    exportButton.textContent = 'Export to Excel'
    exportButton.id = 'export-button-acquaintance'
    exportButton.style.margin = '10px'
    exportButton.addEventListener('click', () => this.exportToExcelAcquaintances(categorizedCoAuthors))
    div.insertBefore(exportButton, normalCanvas.nextSibling)

    const normalCtx = normalCanvas.getContext('2d')
    this.myChartAcquaintance = new Chart(normalCtx, this.configuration)
  }

  async createCollaboratorChart (categorizedCoAuthors) {
    const sortedYears = Object.keys(categorizedCoAuthors).sort((a, b) => a - b)

    const datasets = [{
      label: 'Collaborators',
      data: sortedYears.map(year => categorizedCoAuthors[year].collaborator),
      backgroundColor: 'rgba(75, 192, 192)',
      stack: 'stacked'
    }]

    this.configuration = {
      type: 'bar',
      data: {
        labels: sortedYears,
        datasets: datasets
      },
      options: {
        scales: {
          x: {
            stacked: true
          },
          y: {
            stacked: true,
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            align: 'start'
          }
        }
      }
    }

    let normalCanvas = document.getElementById('myChartCollaborators')
    const div = document.getElementById('authorpage-refine')
    const largeCanvas = document.createElement('canvas')

    if (!normalCanvas) {
      normalCanvas = document.createElement('canvas')
      normalCanvas.id = 'myChartCollaborators'
      normalCanvas.width = 800
      normalCanvas.height = 600

      largeCanvas.id = 'myLargeChartCollaborators'
      largeCanvas.width = 1100
      largeCanvas.height = 700
    } else {
      const normalCtx = normalCanvas.getContext('2d')
      if (this.myChartCollaborator) {
        this.myChartCollaborator.destroy()
      }
      normalCtx.clearRect(0, 0, normalCanvas.width, normalCanvas.height)
    }

    normalCanvas.addEventListener('click', () => {
      this.toggleChartModal(normalCanvas, largeCanvas, categorizedCoAuthors, true)
    })

    const previousTitle = document.getElementById('collaborators-title')
    if (previousTitle) {
      previousTitle.remove()
    }

    const previousButton = document.getElementById('export-button-collaborators')
    if (previousButton) {
      previousButton.remove()
    }

    const title = document.createElement('p')
    title.id = 'collaborators-title'
    const text = document.createElement('b')
    text.innerHTML = 'Collaborators'
    title.appendChild(text)
    div.insertBefore(normalCanvas, div.firstChild)
    div.insertBefore(title, normalCanvas)

    const exportButton = document.createElement('button')
    exportButton.textContent = 'Export to Excel'
    exportButton.id = 'export-button-collaborators'
    exportButton.style.margin = '10px'
    exportButton.addEventListener('click', () => this.exportToExcelCollaborators(categorizedCoAuthors))
    div.insertBefore(exportButton, normalCanvas.nextSibling)

    const normalCtx = normalCanvas.getContext('2d')
    this.myChartCollaborator = new Chart(normalCtx, this.configuration)
  }

  toggleChartModal (normalCanvas, largeCanvas, categorizedCoAuthors, enlarge) {
    let backdrop = document.querySelector('.modal-backdrop')
    if (!backdrop) {
      backdrop = document.createElement('div')
      backdrop.classList.add('modal-backdrop')
      backdrop.style.display = 'none' // Initially hidden
      document.body.appendChild(backdrop)
    }

    if (enlarge) {
      // Apply modal-specific styles
      largeCanvas.classList.add('modal-canvas', 'modal-view')

      // Always remove the old chart and create a new one for consistency
      if (this.myLargeChartCollaborator) {
        this.myLargeChartCollaborator.destroy() // Destroy the old chart instance
      }
      // Get the context of the large canvas
      const largeCtx = largeCanvas.getContext('2d')
      // Clone the chart configuration and adjust as needed for the larger size
      let largeConfiguration = JSON.parse(JSON.stringify(this.configuration))
      largeConfiguration.options.maintainAspectRatio = false
      // Adjust other configuration options as needed
      largeConfiguration.options.scales.x.ticks.autoSkip = false
      largeConfiguration.options.scales.x.ticks.maxRotation = 90

      this.myLargeChartCollaborator = new Chart(largeCtx, largeConfiguration) // Create a new chart instance

      backdrop.appendChild(largeCanvas)
      backdrop.style.display = 'flex'
      normalCanvas.style.display = 'none' // Hide the normal canvas

      backdrop.onclick = () => {
        this.toggleChartModal(normalCanvas, largeCanvas, categorizedCoAuthors, false)
      }
    } else {
      // Remove modal-specific styles
      largeCanvas.classList.remove('modal-canvas', 'modal-view')

      // Move the normal canvas back into the main page and hide the modal
      backdrop.removeChild(largeCanvas)
      backdrop.style.display = 'none'
      normalCanvas.style.display = 'block' // Show the normal canvas

      // If needed, update the normal chart instance
      this.myChartAcquaintance.update()
    }
  }
}

export default AuthorCollaborations
