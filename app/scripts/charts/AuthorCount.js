import Chart from 'chart.js/auto'
import * as xlsx from 'xlsx'

class AuthorCount {
  constructor () {
    this.myChartAuthor = null
    this.myLargeChartAuthor = null
    this.configuration = null
    this.publications = null
    this.numberOfAuthorsParameter = 3
    this.filters = {
      'informal': true,
      'data': true,
      'editor': true,
      'incollection': true,
      'inproceedings': true,
      'article': true
    }
    this.initEventListeners()
  }

  async init (xmlDoc, numberOfAuthorsParameter) {
    try {
      const result = xmlDoc
      this.publications = result.querySelectorAll('dblpperson > r')
      this.numberOfAuthorsParameter = numberOfAuthorsParameter

      const yearCounts = this.countPublicationsByAuthorCount(this.publications, numberOfAuthorsParameter, this.filters)
      await this.createChartAuthorCount(yearCounts, numberOfAuthorsParameter)
    } catch (error) {
      console.error('An error occurred:', error)
    }
  }

  countPublicationsByAuthorCount (publications, numberOfAuthorsParameter, filters) {
    const authorCountCategories = {
      threeOrLessAuthors: {},
      moreThanThreeAuthors: {}
    }

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
        let authors = Array.from(publication.children[0].children).filter(element => element.tagName === 'author')
        let year = Array.from(publication.children[0].children).find(element => element.tagName === 'year').innerHTML

        // Categorize by number of authors
        if (authors.length <= numberOfAuthorsParameter) {
          authorCountCategories.threeOrLessAuthors[year] = (authorCountCategories.threeOrLessAuthors[year] || 0) + 1
        } else {
          authorCountCategories.moreThanThreeAuthors[year] = (authorCountCategories.moreThanThreeAuthors[year] || 0) + 1
        }
      }
    })
    return authorCountCategories
  }

  initEventListeners () {
    const checkAndBind = () => {
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

  handleFilterChange () {
    const filters = {}
    const filterIds = [
      'show-informal', 'show-data', 'show-editor',
      'show-incollection', 'show-inproceedings', 'show-article'
    ]

    filterIds.forEach(id => {
      const checkbox = document.getElementById(id)
      if (checkbox) {
        filters[checkbox.id.replace('show-', '')] = checkbox.checked
      }
    })

    const categorizedAuthorCount = this.countPublicationsByAuthorCount(this.publications || [], this.numberOfAuthorsParameter, filters)
    this.createChartAuthorCount(categorizedAuthorCount, this.numberOfAuthorsParameter)
  }

  prepareDataForExcel (authorCountCategories, activeFiltersString) {
    const years = Object.keys({
      ...authorCountCategories.threeOrLessAuthors,
      ...authorCountCategories.moreThanThreeAuthors
    }).sort()

    let data = years.map(year => {
      return {
        Year: year,
        '3 or Fewer Authors': authorCountCategories.threeOrLessAuthors[year] || 0,
        'More Than 3 Authors': authorCountCategories.moreThanThreeAuthors[year] || 0
      }
    })

    let activeFiltersRow = { Year: 'Active Filters:', '3 or Fewer Authors': activeFiltersString }

    data.splice(0, 0, activeFiltersRow)

    return data
  }

  exportToExcel (authorCountCategories, activeFiltersString) {
    const data = this.prepareDataForExcel(authorCountCategories, activeFiltersString)
    const worksheet = xlsx.utils.json_to_sheet(data)
    const workbook = xlsx.utils.book_new()
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Number of Authors')
    xlsx.writeFile(workbook, 'number_of_Authors.xlsx')
  }
  async createChartAuthorCount (authorCountCategories, numberOfAuthorsParameter) {
    const sortedYears = Object.keys({
      ...authorCountCategories.threeOrLessAuthors,
      ...authorCountCategories.moreThanThreeAuthors
    }).sort((a, b) => a - b)

    const datasets = [
      {
        label: numberOfAuthorsParameter + ' or Fewer Authors',
        data: sortedYears.map(year => authorCountCategories.threeOrLessAuthors[year] || 0),
        backgroundColor: 'rgba(75, 192, 192)',
        stack: 'stacked'
      },
      {
        label: 'More Than ' + numberOfAuthorsParameter + ' Authors',
        data: sortedYears.map(year => authorCountCategories.moreThanThreeAuthors[year] || 0),
        backgroundColor: 'rgba(153, 102, 255)',
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

    if (this.myChartAuthor) {
      this.destroy()
    }

    let normalCanvas = document.getElementById('myChartAuthor')
    const div = document.getElementById('authorpage-refine')
    const largeCanvas = document.createElement('canvas')

    if (normalCanvas == null) {
      normalCanvas = document.createElement('canvas')
      normalCanvas.id = 'myChartAuthor'
      normalCanvas.width = 800
      normalCanvas.height = 600
      div.appendChild(normalCanvas)

      largeCanvas.id = 'myLargeChartAuthor'
      largeCanvas.width = 1100
      largeCanvas.height = 700
    } else {
      const normalCtx = normalCanvas.getContext('2d')
      normalCtx.clearRect(0, 0, normalCanvas.width, normalCanvas.height)
    }

    normalCanvas.addEventListener('click', () => {
      this.toggleChartModal(normalCanvas, authorCountCategories, true)
    })

    const previousTitle = document.getElementById('number-authors-title')
    if (previousTitle) {
      previousTitle.remove()
    }

    const title = document.createElement('p')
    title.id = 'number-authors-title'
    const text = document.createElement('b')
    text.innerHTML = 'Number of Authors'
    title.appendChild(text)
    div.insertBefore(normalCanvas, div.firstChild)
    div.insertBefore(title, normalCanvas)

    const normalCtx = normalCanvas.getContext('2d')
    this.myChartAuthor = new Chart(normalCtx, this.configuration)
  }

  toggleChartModal (normalCanvas, largeCanvas, authorCountCategories, enlarge) {
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
      if (this.myLargeChartAuthor) {
        this.myLargeChartAuthor.destroy() // Destroy the old chart instance
      }
      // Get the context of the large canvas
      const largeCtx = largeCanvas.getContext('2d')
      // Clone the chart configuration and adjust as needed for the larger size
      let largeConfiguration = JSON.parse(JSON.stringify(this.configuration))
      largeConfiguration.options.maintainAspectRatio = false
      // Adjust other configuration options as needed
      largeConfiguration.options.scales.x.ticks.autoSkip = false
      largeConfiguration.options.scales.x.ticks.maxRotation = 90

      this.myLargeChartAuthor = new Chart(largeCtx, largeConfiguration) // Create a new chart instance

      backdrop.appendChild(largeCanvas)
      backdrop.style.display = 'flex'
      normalCanvas.style.display = 'none' // Hide the normal canvas

      backdrop.onclick = () => {
        this.toggleChartModal(normalCanvas, largeCanvas, authorCountCategories, false)
      }
    } else {
      // Remove modal-specific styles
      largeCanvas.classList.remove('modal-canvas', 'modal-view')

      // Move the normal canvas back into the main page and hide the modal
      backdrop.removeChild(largeCanvas)
      backdrop.style.display = 'none'
      normalCanvas.style.display = 'block' // Show the normal canvas

      // If needed, update the normal chart instance
      this.myChartAuthor.update()
    }
  }

  destroy () {
    if (this.myChartAuthor) {
      this.myChartAuthor.destroy()
    }
  }
}

export default AuthorCount
