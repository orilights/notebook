import { marked } from 'marked'
import hljs from 'highlight.js'
import Sortable, { AutoScroll } from 'sortablejs/modular/sortable.core.esm.js'

let container = null
let noteData = null
let noteID = ""

Sortable.mount(new AutoScroll());

marked.setOptions({
    highlight: function (code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
    },
    langPrefix: 'hljs language-'
})

function setupBlockContainer(blockContainer, recvNoteData, recvNoteID) {
    container = blockContainer
    noteData = recvNoteData
    noteID = recvNoteID
    console.log('[notebook]Load note ' + noteID);
    renderBlockContainer()
}

function renderBlockContainer() {
    container.innerHTML = ''
    for (let block of noteData.blocks) {
        container.append(initBlock(block))
    }
    Sortable.create(container, {
        ghostClass: "ghost",
        animation: 150,
        easing: "cubic-bezier(1, 0, 0, 1)",
        handle: '.move-handle',
        scroll: true,
        onUpdate: blockMove
    })
}

function initBlock(blockData) {
    let cBlock = document.createElement('div')
    let cBlockContent = document.createElement('div')
    let cBlockEditbox = document.createElement('textarea')
    let cBlockInfo = document.createElement('div')
    let cBlockCtrl = document.createElement('div')

    let cBlockCtrlBtnOption = document.createElement('button')
    let cBlockCtrlBtnNew = document.createElement('button')
    let cBlockCtrlBtnDelete = document.createElement('button')
    let cBlockCtrlBtnMoveUp = document.createElement('button')
    let cBlockCtrlBtnMoveDown = document.createElement('button')

    cBlock.className = 'block'
    cBlockContent.className = 'content-rendered'
    cBlockEditbox.className = 'content-editor'
    cBlockInfo.className = 'block-info'
    cBlockCtrl.className = 'block-ctrl'
    cBlockCtrlBtnOption.className = 'block-ctrl-btn move-handle'
    cBlockCtrlBtnNew.className = cBlockCtrlBtnDelete.className = cBlockCtrlBtnMoveUp.className = cBlockCtrlBtnMoveDown.className = 'block-ctrl-btn'

    cBlockContent.innerHTML = marked.parse(blockData.blkContent)
    cBlockInfo.textContent = "Block ID：" + blockData.blkID + " | 创建人：" + blockData.blkAuthor + " | 创建时间：" + blockData.blkCreateTime
    cBlockCtrlBtnOption.innerHTML = '<i class="iconfont icon-elipsis"></i>'
    cBlockCtrlBtnNew.innerHTML = '<i class="iconfont icon-add"></i>'
    cBlockCtrlBtnDelete.innerHTML = '<i class="iconfont icon-ashbin"></i>'
    cBlockCtrlBtnMoveUp.innerHTML = '<i class="iconfont icon-direction-up"></i>'
    cBlockCtrlBtnMoveDown.innerHTML = '<i class="iconfont icon-direction-down"></i>'


    cBlock.setAttribute('data-bid', blockData.blkID)
    // cBlock.addEventListener('dblclick', editorSwitch)

    cBlockContent.addEventListener('dblclick', editorSwitch)
    cBlockEditbox.addEventListener('dblclick', editorSwitch)
    cBlockEditbox.addEventListener('input', (e) => {
        cBlockEditbox.style.height = '100px'
        cBlockEditbox.style.height = e.target.scrollHeight + 'px';
    });
    cBlockEditbox.addEventListener('focusout', editorFocusout)
    cBlockCtrlBtnNew.onclick = (e) => { blockNew(getBlockIndex(blockData.blkID)) }
    cBlockCtrlBtnDelete.onclick = (e) => { blockDelete(getBlockIndex(blockData.blkID)) }
    cBlockCtrlBtnMoveUp.onclick = (e) => { blockExchange(getBlockIndex(blockData.blkID), getBlockIndex(blockData.blkID) - 1) }
    cBlockCtrlBtnMoveDown.onclick = (e) => { blockExchange(getBlockIndex(blockData.blkID), getBlockIndex(blockData.blkID) + 1) }

    cBlockCtrl.append(cBlockCtrlBtnOption, cBlockCtrlBtnNew, cBlockCtrlBtnDelete, cBlockCtrlBtnMoveUp, cBlockCtrlBtnMoveDown)
    cBlock.append(cBlockContent, cBlockEditbox, cBlockInfo, cBlockCtrl)
    return cBlock
}

function getBlockIndex(bid) {
    for (let block of noteData.blocks) {
        if (block.blkID == bid) {
            return noteData.blocks.indexOf(block)
        }
    }
}

function editorSwitch(event) {
    function findUpperBlockNode(node) {
        return node.classList.contains('block') ? node : findUpperBlockNode(node.parentElement)
    }
    let block = findUpperBlockNode(event.currentTarget)
    let bid = getBlockIndex(block.getAttribute('data-bid'))
    if (block.classList.contains('editmode')) {
        block.classList.remove('editmode')
        noteData.blocks[bid].blkContent = block.childNodes[1].value
        block.childNodes[0].innerHTML = marked.parse(noteData.blocks[bid].blkContent)
        noteDataSave()
    } else {
        block.childNodes[1].value = noteData.blocks[bid].blkContent
        block.childNodes[0].innerHTML = '<span style="color: #4b0082">编辑模式</span>'
        block.classList.add('editmode')
        block.childNodes[1].style.height = '80px'
        block.childNodes[1].style.height = block.childNodes[1].scrollHeight + 'px';
        block.childNodes[1].focus()
    }
}

function editorFocusout(event) {
    let block = event.target.parentElement
    let bid = getBlockIndex(block.getAttribute('data-bid'))
    if (block.classList.contains('editmode')) {
        block.classList.remove('editmode')
        noteData.blocks[bid].blkContent = block.childNodes[1].value
        block.childNodes[0].innerHTML = marked.parse(noteData.blocks[bid].blkContent)
        noteDataSave()
    }
}

function blockNew(pos) {
    let nBlockData = {
        blkID: ++noteData.inc,
        blkType: 'Markdown',
        blkContent: 'New Block\n \n任意写作',
        blkAuthor: "anonymous",
        blkCreateTime: Date.now(),
        blkLastEditTime: Date.now()
    }
    noteData.blocks.splice(pos + 1, 0, nBlockData)
    container.childNodes[pos].after(initBlock(nBlockData))
    noteDataSave()
}

function blockDelete(pos) {
    noteData.blocks.splice(pos, 1)
    container.childNodes[pos].remove()
    noteDataSave()
}

function blockMove(evt) {
    let blockPos = evt.oldIndex
    let blockData = noteData.blocks.splice(blockPos, 1)[0]
    noteData.blocks.splice(evt.newIndex, 0, blockData)
    noteDataSave()
}

function blockExchange(blockPos1, blockPos2) {
    if (blockPos2 == -1 || blockPos2 == noteData.blocks.length) { return null }
    let block1 = container.childNodes[blockPos1]
    let block2 = container.childNodes[blockPos2]
    let tempNode = document.createElement('div')
    container.insertBefore(tempNode, block2)
    container.insertBefore(block2, block1)
    container.insertBefore(block1, tempNode)
    tempNode.remove()

    let tempData = noteData.blocks[blockPos1]
    noteData.blocks[blockPos1] = noteData.blocks[blockPos2]
    noteData.blocks[blockPos2] = tempData
    noteDataSave()
}

function noteDataSave() {
    localStorage.setItem("noteData-" + noteID, JSON.stringify(noteData))
    console.log('[notebook]Save block data ' + noteID);
}

export { setupBlockContainer }