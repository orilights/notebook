import 'highlight.js/styles/atom-one-dark.css'
import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'

import './style.css'

import { setupBlockContainer } from './components/block-container'
import { setupNavTOC } from './components/nav-toc'

let appData = {}
let noteData = {}

if (localStorage.getItem("appData") != null) {
  appData = JSON.parse(localStorage.getItem("appData"))
  getNote()
} else {
  axios.get("/template/app-data-template.json").then((responce) => {
    appData = responce.data
    localStorage.setItem("appData", JSON.stringify(appData))
    getNote()
  })
}

function getNote() {
  if (appData.noteList.length > 0) {
    if (appData.currentNote == "") {
      appData.currentNote = appData.noteList[0]
    }
    noteData = JSON.parse(localStorage.getItem("noteData-" + appData.currentNote))
    setupApp()
  } else {
    axios.get("/template/new-note-template.json").then((responce) => {
      noteData = responce.data
      appData.noteList.push(uuidv4())
      appData.currentNote = appData.noteList[0]
      localStorage.setItem("noteData-" + appData.currentNote, JSON.stringify(noteData))
      localStorage.setItem("appData", JSON.stringify(appData))
      setupApp()
    })
  }
}

function addNote() {
  axios.get("/template/new-note-template.json").then((responce) => {
    noteData = responce.data
    appData.noteList.push(uuidv4())
    appData.currentNote = appData.noteList[appData.noteList.length - 1]
    localStorage.setItem("noteData-" + appData.currentNote, JSON.stringify(noteData))
    localStorage.setItem("appData", JSON.stringify(appData))
    setupApp()
  })
}

function delNote() {
  let toDelNote = appData.currentNote
  localStorage.removeItem("noteData-" + toDelNote)
  localStorage.setItem("appData", JSON.stringify(appData))
  if (toDelNote == appData.currentNote) {
    if (appData.noteList.length == 0) {
      addNote()
    } else {
      appData.currentNote = appData.noteList[0]
      localStorage.setItem("appData", JSON.stringify(appData))
      setupApp()
    }
  }
}

function dataClear(){
  localStorage.clear()
  location.reload()
}

function switchNote(noteID) {
  appData.currentNote = noteID
  noteData = JSON.parse(localStorage.getItem("noteData-" + appData.currentNote))
  localStorage.setItem("appData", JSON.stringify(appData))
  setupApp()
}

function switchNav() {
  let nav = document.querySelector('#nav-main')
  let navCtrl = document.querySelector('#nav-ctrl')
  if (nav.classList.contains('nav-fold')) {
    nav.classList.remove('nav-fold')
    navCtrl.textContent = '收起'
  } else {
    nav.classList.add('nav-fold')
    navCtrl.textContent = '展开'
  }
}

function setupApp() {
  document.querySelector('#app').innerHTML = `
  <nav id="nav-main">
    <div class="title">NoteBook</div>
    <button id="nav-note-add">新增笔记</button>
    <button id="nav-data-clear">清除数据</button>
    <button id="nav-note-del">删除当前笔记</button>
    <div id="nav-toc"></div>
    <button id="nav-ctrl">收起</button>
  </nav>
  <div id="note-container">
    <div class="title" contenteditable>
      <h1>${noteData.title}</h1>
    </div>
    <div id="block-container"></div>
  </div>
`
  document.querySelector('#nav-note-add').onclick = addNote
  document.querySelector('#nav-note-del').onclick = delNote
  document.querySelector('#nav-data-clear').onclick = dataClear
  document.querySelector('#nav-ctrl').onclick = switchNav
  setupNavTOC(document.querySelector('#nav-toc'), appData, switchNote)
  setupBlockContainer(document.querySelector('#block-container'), noteData, appData.currentNote)
}
