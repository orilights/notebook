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
  console.log('[notebook]Load data from localStorage');
  getNote()
} else {
  axios.get("/template/app-data-template.json").then((responce) => {
    appData = responce.data
    localStorage.setItem("appData", JSON.stringify(appData))
    console.log('[notebook]Load data from template');
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
    addNote()
  }
}

function addNote() {
  axios.get("/template/new-note-template.json").then((responce) => {
    noteData = responce.data
    appData.noteList.push(uuidv4())
    appData.currentNote = appData.noteList[appData.noteList.length - 1]
    console.log('[notebook]Add note ' + appData.currentNote);
    localStorage.setItem("noteData-" + appData.currentNote, JSON.stringify(noteData))
    localStorage.setItem("appData", JSON.stringify(appData))
    setupApp()
  })
}

function delNote() {
  let delNote = appData.currentNote
  let delNoteIndex = appData.noteList.indexOf(delNote)
  localStorage.removeItem("noteData-" + delNote)
  appData.noteList.splice(delNoteIndex, 1)
  localStorage.setItem("appData", JSON.stringify(appData))
  console.log('[notebook]Delete note ' + delNote);
  if (delNote == appData.currentNote) {
    if (appData.noteList.length == 0) {
      addNote()
    } else {
      if (delNoteIndex == 0) {
        appData.currentNote = appData.noteList[0]
      } else {
        appData.currentNote = appData.noteList[delNoteIndex - 1]
      }
      localStorage.setItem("appData", JSON.stringify(appData))
      setupApp()
    }
  }
}

function readNoteFromFile() {
  let tmpInput = document.createElement('input')
  tmpInput.style.display = 'none'
  tmpInput.type = 'file'
  tmpInput.setAttribute('filename', 'note.json')
  tmpInput.accept = 'application/json'
  document.body.appendChild(tmpInput)

  tmpInput.addEventListener('change', () => {
    const reader = new FileReader()
    reader.readAsText(tmpInput.files[0], 'utf8')
    reader.onload = () => {
      localStorage.setItem("noteData-" + appData.currentNote, reader.result)
      setupApp()
    }
    document.body.removeChild(tmpInput)
  }, false)
  tmpInput.click()
}

function saveNoteAsFile() {
  let content = JSON.stringify(noteData);
  let blob = new Blob([content], { type: "text/plain;charset=utf-8" })
  let tmpLink = document.createElement('a')
  tmpLink.download = "note.json"
  tmpLink.style.display = 'none'
  tmpLink.href = URL.createObjectURL(blob)
  document.body.appendChild(tmpLink)
  tmpLink.click()
  document.body.removeChild(tmpLink)
}

function noteTitleKeyDown(e) {
  if (e.keyCode == 13) {
    e.preventDefault()
  }
}

function noteTitleChange(e) {
  noteData.title = e.target.innerHTML
  localStorage.setItem("noteData-" + appData.currentNote, JSON.stringify(noteData))
  setupNavTOC(document.querySelector('#nav-toc'), appData, switchNote)
}

function dataClear() {
  localStorage.clear()
  location.reload()
}

function switchNote(noteID) {
  appData.currentNote = noteID
  localStorage.setItem("appData", JSON.stringify(appData))
  setupApp()
}

function initNav() {
  let nav = document.querySelector('#nav-main')
  let navCtrl = document.querySelector('#nav-ctrl')
  if (!appData.navExpand) {
    nav.classList.add('nav-fold')
    navCtrl.textContent = '展开'
  }
}

function switchNav() {
  let nav = document.querySelector('#nav-main')
  let navCtrl = document.querySelector('#nav-ctrl')
  if (nav.classList.contains('nav-fold')) {
    nav.classList.remove('nav-fold')
    navCtrl.textContent = '收起'
    appData.navExpand = true
  } else {
    nav.classList.add('nav-fold')
    navCtrl.textContent = '展开'
    appData.navExpand = false
  }
  localStorage.setItem("appData", JSON.stringify(appData))
}

function setupApp() {
  noteData = JSON.parse(localStorage.getItem("noteData-" + appData.currentNote))
  document.querySelector('#app').innerHTML = `
  <nav id="nav-main">
    <div class="title">NoteBook</div>
    <button id="nav-note-add">新增笔记</button>
    <button id="nav-note-del">删除笔记</button>
    <button id="nav-data-clear">清除数据</button>
    <div id="nav-toc"></div>
    <button id="nav-ctrl">收起</button>
  </nav>
  <div id="note-container">
    <div class="title">
      <h1 id="note-title" contenteditable>${noteData.title}</h1>
      <button id="note-add-top" class="note-top-ctrl">新增 Block</button>
      <button id="note-save" class="note-top-ctrl">保存当前笔记到文件</button>
      <button id="note-read" class="note-top-ctrl">从文件读取笔记数据</button>
    </div>
    <div id="block-container"></div>
  </div>
`
  document.querySelector('#nav-note-add').onclick = addNote
  document.querySelector('#nav-note-del').onclick = delNote
  document.querySelector('#nav-data-clear').onclick = dataClear
  document.querySelector('#nav-ctrl').onclick = switchNav
  document.querySelector('#note-save').onclick = saveNoteAsFile
  document.querySelector('#note-read').onclick = readNoteFromFile
  document.querySelector('#note-title').addEventListener('focusout', noteTitleChange)
  document.querySelector('#note-title').addEventListener('keydown', noteTitleKeyDown)
  initNav()
  setupNavTOC(document.querySelector('#nav-toc'), appData, switchNote)

  setupBlockContainer(document.querySelector('#block-container'), noteData, appData.currentNote)
}

