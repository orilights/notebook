let navNode = null
let appData = null
let switchNote = null

function setupNavTOC(recvNavNode, recvAppData,func_switchNote) {
    navNode = recvNavNode
    appData = recvAppData
    switchNote = func_switchNote
    renderNav()
}

function renderNav() {
    navNode.innerHTML = ''
    for (let note of appData.noteList) {
        let noteData = JSON.parse(localStorage.getItem('noteData-' + note))
        console.log(note);
        navNode.append(initNavItem(noteData.title,note))
    }
}

function initNavItem(title,noteID) {
    let cItem = document.createElement('div')

    cItem.className = 'nav-toc-item'

    cItem.innerText = title

    cItem.onclick = (e)=>{
        switchNote(noteID);
    }

    if(appData.currentNote == noteID){
        cItem.classList.add('select')
    }

    return cItem
}

export { setupNavTOC }