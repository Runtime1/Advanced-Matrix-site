


// Mobile navigation
function sendLog(message) {
    fetch('/log', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: message }),
    }).catch(error => console.error('Error:', error));
}

sendLog('Script loaded');
const mobileNav = document.getElementById('mobile-nav');
const windowElements = document.querySelectorAll('.window');

mobileNav.addEventListener('click', (e) => {
    sendLog('Mobile nav clicked', e.target);
    if (e.target.tagName === 'BUTTON') {
        const targetId = e.target.id.replace('-nav', '-window');
        windowElements.forEach(window => {
            window.classList.remove('active');
            if (window.id === targetId) {
                window.classList.add('active');
                sendLog('Window activated:', targetId);
            }
        });
    }
});

// Window management
let managedWindows = [];
let activeWindow = null;
let zIndex = 1000;

function initializeWindows() {
    windowElements.forEach((window, index) => {
        const id = window.id;
        const title = window.querySelector('.window-header span').textContent;
        const x = 10 + (index * 30);
        const y = 10 + (index * 30);
        const width = 400;
        const height = 300;

        setupWindow(window, id, title, x, y, width, height);
    });
    updateTaskbar();
}


function setupWindow(window, id, title, x, y, width, height) {
    window.style.left = x + 'px';
    window.style.top = y + 'px';
    window.style.width = width + 'px';
    window.style.height = height + 'px';
    window.style.zIndex = zIndex++;

    const header = window.querySelector('.window-header');
    const closeBtn = header.querySelector('.close-btn');
    const minimizeBtn = header.querySelector('.minimize-btn');
    const maximizeBtn = header.querySelector('.maximize-btn');

    closeBtn.addEventListener('click', () => closeWindow(window));
    minimizeBtn.addEventListener('click', () => minimizeWindow(window));
    maximizeBtn.addEventListener('click', () => maximizeWindow(window));

    header.addEventListener('mousedown', (e) => {
        if (e.target === header) {
            startDragging(e, window);
        }
    });

    window.addEventListener('mousedown', () => focusWindow(window));

    // Add resize functionality
    const resizer = document.createElement('div');
    resizer.className = 'resizer';
    window.appendChild(resizer);
    resizer.addEventListener('mousedown', initResize, false);

    managedWindows.push(window);
}

function initResize(e) {
    window.addEventListener('mousemove', resize, false);
    window.addEventListener('mouseup', stopResize, false);
}

function resize(e) {
    if (activeWindow) {
        const width = e.clientX - activeWindow.offsetLeft;
        const height = e.clientY - activeWindow.offsetTop;
        activeWindow.style.width = width + 'px';
        activeWindow.style.height = height + 'px';
    }
}

function stopResize(e) {
    window.removeEventListener('mousemove', resize, false);
    window.removeEventListener('mouseup', stopResize, false);
}

function closeWindow(window) {
    window.style.display = 'none';
    const index = managedWindows.indexOf(window);
    if (index > -1) {
        managedWindows.splice(index, 1);
    }
    updateTaskbar();
}

function minimizeWindow(window) {
    window.style.display = 'none';
    updateTaskbar();
}

function maximizeWindow(window) {
    const desktop = document.getElementById('desktop');
    if (window.dataset.isMaximized === 'true') {
        window.style.left = window.dataset.originalLeft;
        window.style.top = window.dataset.originalTop;
        window.style.width = window.dataset.originalWidth;
        window.style.height = window.dataset.originalHeight;
        window.dataset.isMaximized = 'false';
    } else {
        window.dataset.originalLeft = window.style.left;
        window.dataset.originalTop = window.style.top;
        window.dataset.originalWidth = window.style.width;
        window.dataset.originalHeight = window.style.height;
        window.style.left = '0';
        window.style.top = '0';
        window.style.width = desktop.clientWidth + 'px';
        window.style.height = desktop.clientHeight + 'px';
        window.dataset.isMaximized = 'true';
    }
    window.style.zIndex = zIndex++;
    focusWindow(window);
}

function focusWindow(window) {
    window.style.display = 'flex';
    window.style.zIndex = zIndex++;
    activeWindow = window;
    updateTaskbar();
}

// Window drag functionality
let isDragging = false;
let dragTarget = null;
let startX, startY, startLeft, startTop;

function startDragging(e, window) {
    isDragging = true;
    dragTarget = window;
    startX = e.clientX;
    startY = e.clientY;
    startLeft = parseInt(window.style.left, 10);
    startTop = parseInt(window.style.top, 10);
    window.style.zIndex = zIndex++;
}

function stopDragging() {
    isDragging = false;
    dragTarget = null;
}

function drag(e) {
    if (isDragging && dragTarget) {
        const desktop = document.getElementById('desktop');
        const desktopRect = desktop.getBoundingClientRect();
        let newX = startLeft + e.clientX - startX;
        let newY = startTop + e.clientY - startY;

        // Ensure the window stays within the desktop boundaries
        newX = Math.max(0, Math.min(newX, desktopRect.width - dragTarget.offsetWidth));
        newY = Math.max(0, Math.min(newY, desktopRect.height - dragTarget.offsetHeight));

        dragTarget.style.left = newX + 'px';
        dragTarget.style.top = newY + 'px';
    }
}

document.addEventListener('mousemove', drag);
document.addEventListener('mouseup', stopDragging);

// Taskbar
function updateTaskbar() {
    const taskbar = document.getElementById('taskbar-items');
    taskbar.innerHTML = '';
    managedWindows.forEach(window => {
        const taskbarItem = document.createElement('div');
        taskbarItem.classList.add('taskbar-item');
        taskbarItem.textContent = window.querySelector('.window-header span').textContent;
        if (window === activeWindow) {
            taskbarItem.classList.add('active');
        }
        taskbarItem.addEventListener('click', () => {
            if (window.style.display === 'none') {
                window.style.display = 'flex';
            }
            focusWindow(window);
        });
        taskbar.appendChild(taskbarItem);
    });
}

// Initialize windows
document.addEventListener('DOMContentLoaded', () => {
    initializeWindows();
    initializeTerminal();
    initializeFileExplorer();
    initializeFileEditor();
});

// Terminal functionality
function initializeTerminal() {
    const terminalInput = document.getElementById('terminal-input');
    const terminalOutput = document.getElementById('terminal-output');

    terminalInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const command = terminalInput.value.trim();
            terminalInput.value = '';
            executeCommand(command);
        }
    });

    function executeCommand(command) {
        appendToTerminal(`$ ${command}`);
        
        switch(command.toLowerCase()) {
            case 'help':
                appendToTerminal('Available commands: help, clear, date, echo [text]');
                break;
            case 'clear':
                terminalOutput.innerHTML = '';
                break;
            case 'date':
                appendToTerminal(new Date().toString());
                break;
            default:
                if (command.toLowerCase().startsWith('echo ')) {
                    appendToTerminal(command.slice(5));
                } else {
                    appendToTerminal(`Command not found: ${command}`);
                }
        }
    }

    function appendToTerminal(text) {
        const line = document.createElement('div');
        line.textContent = text;
        terminalOutput.appendChild(line);
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
    }
}

// File Explorer functionality
function initializeFileExplorer() {
    const fileList = document.getElementById('file-list');
    const files = [
        { name: 'Document.txt', type: 'file' },
        { name: 'Images', type: 'folder' },
        { name: 'Project.js', type: 'file' },
    ];

    files.forEach(file => {
        const li = document.createElement('li');
        li.textContent = file.name;
        li.classList.add(file.type);
        li.addEventListener('click', () => {
            if (file.type === 'file') {
                openFileInEditor(file.name);
            }
        });
        fileList.appendChild(li);
    });
}

// File Editor functionality
function initializeFileEditor() {
    const editor = document.getElementById('editor');
    editor.value = '// Everyone is smart in some way.\n// Just be yourself.\n// Be brave.\n// Be kind.';
}

function openFileInEditor(fileName) {
    const editor = document.getElementById('editor');
    const editorWindow = document.getElementById('editor-window');
    
    // Simulate file content (in a real app, this would load the actual file content)
    const fileContent = `This is the content of ${fileName}`;
    
    editor.value = fileContent;
    focusWindow(editorWindow);
}

// Network Topology functionality
function initializeNetworkTopology() {
    const networkTopology = document.getElementById('network-topology');
    const nodes = ['Server', 'Router', 'Client 1', 'Client 2'];
    
    nodes.forEach(node => {
        const nodeElement = document.createElement('div');
        nodeElement.classList.add('network-node');
        nodeElement.textContent = node;
        networkTopology.appendChild(nodeElement);
    });
}

// Crypto Miner functionality
function initializeCryptoMiner() {
    const startMiningBtn = document.getElementById('start-mining');
    const miningProgress = document.getElementById('mining-progress');
    let isMining = false;
    let progress = 0;

    startMiningBtn.addEventListener('click', () => {
        if (!isMining) {
            isMining = true;
            startMiningBtn.textContent = 'Stop Mining';
            mineCrypto();
        } else {
            isMining = false;
            startMiningBtn.textContent = 'Start Mining';
            progress = 0;
            miningProgress.style.width = '0%';
        }
    });

    function mineCrypto() {
        if (isMining) {
            progress += Math.random() * 10;
            if (progress >= 100) {
                progress = 100;
                isMining = false;
                startMiningBtn.textContent = 'Start Mining';
            }
            miningProgress.style.width = `${progress}%`;
            miningProgress.textContent = `${Math.round(progress)}%`;
            setTimeout(mineCrypto, 500);
        }
    }
}

// Hacking Challenge functionality
function initializeHackingChallenge() {
    const challengeContent = document.getElementById('challenge-content');
    const challengeInput = document.getElementById('challenge-input');
    const submitChallenge = document.getElementById('submit-challenge');
    
    const challenges = [
        { question: "What is the HTTP status code for 'Not Found'?", answer: "404" },
        { question: "What does SQL stand for?", answer: "Structured Query Language" },
        { question: "What is the most common port number for HTTPS?", answer: "443" }
    ];
    
    let currentChallenge = 0;
    
    function loadChallenge() {
        challengeContent.textContent = challenges[currentChallenge].question;
        challengeInput.value = '';
    }
    
    submitChallenge.addEventListener('click', () => {
        if (challengeInput.value.toLowerCase() === challenges[currentChallenge].answer.toLowerCase()) {
            challengeContent.textContent = "Correct! Loading next challenge...";
            currentChallenge = (currentChallenge + 1) % challenges.length;
            setTimeout(loadChallenge, 1500);
        } else {
            challengeContent.textContent = "Incorrect. Try again!";
        }
    });
    
    loadChallenge();
}

// Update the initialization
document.addEventListener('DOMContentLoaded', () => {
    initializeWindows();
    initializeTerminal();
    initializeFileExplorer();
    initializeFileEditor();
    initializeNetworkTopology();
    initializeCryptoMiner();
    initializeHackingChallenge();
});

// Matrix rain effect
const canvas = document.getElementById('matrix-rain');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const katakana = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン';
const latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const nums = '0123456789';

const alphabet = katakana + latin + nums;

const fontSize = 16;
const columns = canvas.width/fontSize;

const rainDrops = [];

for( let x = 0; x < columns; x++ ) {
    rainDrops[x] = 1;
}

const draw = () => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#0F0';
    ctx.font = fontSize + 'px monospace';

    for(let i = 0; i < rainDrops.length; i++)
    {
        const text = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
        ctx.fillText(text, i*fontSize, rainDrops[i]*fontSize);
        
        if(rainDrops[i]*fontSize > canvas.height && Math.random() > 0.975){
            rainDrops[i] = 0;
        }
        rainDrops[i]++;
    }
};

setInterval(draw, 30);

// Terminal functionality
const terminalOutput = document.getElementById('terminal-output');
const terminalInput = document.getElementById('terminal-input');

const commands = {
    help: 'Available commands: help, clear, echo, date, whoami, ls, cat, ping, nmap, ssh, hack',
    clear: () => terminalOutput.innerHTML = '',
    echo: (args) => args.join(' '),
    date: () => new Date().toLocaleString(),
    whoami: 'Habibi Hacker',
    ls: 'config.sys  autoexec.bat  secret_plans.txt  definitely_not_a_virus.exe',
    cat: (args) => `Content of ${args[0]}: [REDACTED]`,
    ping: (args) => `PING ${args[0]} (127.0.0.1): 56 data bytes
64 bytes from 127.0.0.1: icmp_seq=0 ttl=64 time=0.080 ms`,
    nmap: (args) => `Starting Nmap scan for ${args[0]}...
Nmap scan report for ${args[0]}
Port    State    Service
22/tcp  open     ssh
80/tcp  open     http
443/tcp open     https`,
    ssh: (args) => `ssh: connect to host ${args[0]} port 22: Connection refused`,
    hack: () => {
        simulateHacking();
        return 'Initiating hack...';
    }
};

async function typeCommand(command) {
    const div = document.createElement('div');
    terminalOutput.appendChild(div);
    for (let i = 0; i < command.length; i++) {
        div.textContent += command[i];
        await sleep(Math.random() * 50 + 50);
    }
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

terminalInput.addEventListener('keyup', async function(event) {
    if (event.key === 'Enter') {
        const input = this.value.trim();
        await typeCommand(`$ ${input}`);
        
        const [command, ...args] = input.split(' ');
        if (command in commands) {
            const output = commands[command];
            const result = typeof output === 'function' ? output(args) : output;
            await typeCommand(result);
        } else {
            await typeCommand(`Command not found: ${command}. Type 'help' for available commands.`);
        }
        
        this.value = '';
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
    }
});

// Network topology
const networkTopology = document.getElementById('network-topology');

const nodes = new vis.DataSet([
    { id: 1, label: 'Router' },
    { id: 2, label: 'Server' },
    { id: 3, label: 'Workstation 1' },
    { id: 4, label: 'Workstation 2' },
    { id: 5, label: 'Firewall' }
]);

const edges = new vis.DataSet([
    { from: 1, to: 2 },
    { from: 1, to: 3 },
    { from: 1, to: 4 },
    { from: 1, to: 5 },
    { from: 5, to: 2 }
]);

const data = {
    nodes: nodes,
    edges: edges
};

const options = {
    nodes: {
        shape: 'dot',
        size: 30,
        font: {
            size: 14,
            color: '#ffffff'
        },
        borderWidth: 2,
        shadow: true
    },
    edges: {
        width: 2,
        shadow: true
    }
};

new vis.Network(networkTopology, data, options);

// File explorer
const fileList = document.getElementById('file-list');
const files = [
    { name: 'config.sys', content: 'System configuration file' },
    { name: 'autoexec.bat', content: 'Batch file for system startup' },
    { name: 'secret_plans.txt', content: 'Top secret plans for world domination' },
    { name: 'definitely_not_a_virus.exe', content: 'Executable file (definitely not a virus)' },
    { name: 'family_photos.zip', content: 'Compressed file containing family photos' },
    { name: 'bank_details.xlsx', content: 'Spreadsheet with sensitive financial information' },
    { name: 'world_domination.pdf', content: 'PDF document outlining plans for global conquest' }
];

function renderFiles() {
    fileList.innerHTML = '';
    files.forEach(file => {
        const li = document.createElement('li');
        li.textContent = file.name;
        li.addEventListener('click', () => {
            openFileInEditor(file);
        });
        fileList.appendChild(li);
    });
}

renderFiles();

// File editor
const editor = ace.edit("editor");
editor.setTheme("ace/theme/monokai");
editor.session.setMode("ace/mode/text");

function openFileInEditor(file) {
    editor.setValue(file.content);
    editor.clearSelection();
    document.getElementById('editor-window').style.display = 'block';
}

// Context menu
const contextMenu = document.getElementById('context-menu');
const newFileButton = document.getElementById('new-file');
const newFolderButton = document.getElementById('new-folder');
const refreshButton = document.getElementById('refresh');

document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    contextMenu.style.display = 'block';
    contextMenu.style.left = `${e.clientX}px`;
    contextMenu.style.top = `${e.clientY}px`;
});

document.addEventListener('click', () => {
    contextMenu.style.display = 'none';
});

newFileButton.addEventListener('click', () => {
    const fileName = prompt('Enter file name:');
    if (fileName) {
        files.push({ name: fileName, content: 'New file content' });
        renderFiles();
    }
});

newFolderButton.addEventListener('click', () => {
    const folderName = prompt('Enter folder name:');
    if (folderName) {
        files.push({ name: folderName, content: 'Folder', isFolder: true });
        renderFiles();
    }
});

refreshButton.addEventListener('click', renderFiles);

// Status bar functionality
const cpuUsage = document.querySelector('#cpu-usage span');
const memoryUsage = document.querySelector('#memory-usage span');
const networkActivity = document.querySelector('#network-activity span');

function updateStatusBar() {
    cpuUsage.textContent = Math.floor(Math.random() * 100) + '%';
    memoryUsage.textContent = Math.floor(Math.random() * 100) + '%';
    networkActivity.textContent = Math.floor(Math.random() * 1000) + ' KB/s';
}

setInterval(updateStatusBar, 1000);

// Popup notifications
const popupContainer = document.getElementById('popup-container');

const notifications = [
    'Firewall breach detected!',
    'New vulnerability found: CVE-2023-1234',
    'Intrusion attempt blocked',
    'System update available',
    'Encrypted message received',
    'Backdoor access established',
    'Data exfiltration in progress',
    'New target acquired',
    'Proxy chain initialized',
    'VPN connection established'
];

function createPopup() {
    const popup = document.createElement('div');
    popup.className = 'popup';
    popup.style.left = Math.random() * (window.innerWidth - 200) + 'px';
    popup.style.top = Math.random() * (window.innerHeight - 50) + 'px';
    popup.textContent = notifications[Math.floor(Math.random() * notifications.length)];
    popupContainer.appendChild(popup);
    setTimeout(() => popupContainer.removeChild(popup), 3000);
}

setInterval(createPopup, 5000);

// Hacking progress bar
const hackingProgressContainer = document.getElementById('hacking-progress-container');
const hackingProgressBar = document.getElementById('hacking-progress-bar');
const hackingProgressText = document.getElementById('hacking-progress-text');

function simulateHacking() {
    let progress = 0;
    hackingProgressContainer.style.display = 'block';
    
    const interval = setInterval(() => {
        progress += Math.random() * 5;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            setTimeout(() => {
                hackingProgressContainer.style.display = 'none';
            }, 2000);
        }
        hackingProgressBar.style.width = `${progress}%`;
        hackingProgressText.textContent = `Hacking Progress: ${Math.floor(progress)}%`;
    }, 200);
}

// Crypto miner
const startMiningButton = document.getElementById('start-mining');
const miningProgress = document.getElementById('mining-progress');
let isMining = false;

startMiningButton.addEventListener('click', () => {
    if (!isMining) {
        isMining = true;
        startMiningButton.textContent = 'Stop Mining';
        simulateMining();
    } else {
        isMining = false;
        startMiningButton.textContent = 'Start Mining';
        miningProgress.style.width = '0%';
    }
});

function simulateMining() {
    let progress = 0;
    const interval = setInterval(() => {
        if (!isMining) {
            clearInterval(interval);
            return;
        }
        progress += Math.random() * 2;
        if (progress >= 100) {
            progress = 0;
            createPopup('Bitcoin mined!');
        }
        miningProgress.style.width = `${progress}%`;
    }, 100);
}

// Hacking challenge
const challengeContent = document.getElementById('challenge-content');
const challengeInput = document.getElementById('challenge-input');
const submitChallenge = document.getElementById('submit-challenge');

const challenges = [
    { question: 'What is the most common port for HTTP?', answer: '80' },
    { question: 'What does SQL stand for?', answer: 'Structured Query Language' },
    { question: 'What is the default gateway IP in most home networks?', answer: '192.168.1.1' },
    { question: 'What protocol is used for secure shell connections?', answer: 'SSH' },
    { question: 'What is the name of the attack that floods a server with requests?', answer: 'DDoS' }
];

let currentChallenge = 0;

function loadChallenge() {
    challengeContent.textContent = challenges[currentChallenge].question;
}

submitChallenge.addEventListener('click', () => {
    if (challengeInput.value.toLowerCase() === challenges[currentChallenge].answer.toLowerCase()) {
        alert('Correct! Moving to next challenge.');
        currentChallenge = (currentChallenge + 1) % challenges.length;
        loadChallenge();
        challengeInput.value = '';
    } else {
        alert('Incorrect. Try again!');
    }
});

loadChallenge();

// Draggable and resizable windows (desktop only)
if (window.innerWidth > 768) {
    interact('.window')
      .draggable({
        onmove: window.dragMoveListener,
        modifiers: [
          interact.modifiers.restrictRect({
            restriction: 'parent',
            endOnly: true
          })
        ]
      })
      .resizable({
        edges: { left: true, right: true, bottom: true, top: true },
        listeners: {
          move (event) {
            var target = event.target
            var x = (parseFloat(target.getAttribute('data-x')) || 0)
            var y = (parseFloat(target.getAttribute('data-y')) || 0)

            // update the element's style
            target.style.width = event.rect.width + 'px'
            target.style.height = event.rect.height + 'px'

            // translate when resizing from top or left edges
            x += event.deltaRect.left
            y += event.deltaRect.top

            target.style.transform = `translate(${x}px, ${y}px)`

            target.setAttribute('data-x', x)
            target.setAttribute('data-y', y)
          }
        },
        modifiers: [
          // keep the edges inside the parent
          interact.modifiers.restrictEdges({
            outer: 'parent'
          }),

          // minimum size
          interact.modifiers.restrictSize({
            min: { width: 100, height: 50 }
          })
        ],

        inertia: true
      })

    window.dragMoveListener = function dragMoveListener (event) {
      var target = event.target
      // keep the dragged position in the data-x/data-y attributes
      var x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx
      var y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy

      // translate the element
      target.style.transform = `translate(${x}px, ${y}px)`

      // update the posiion attributes
      target.setAttribute('data-x', x)
      target.setAttribute('data-y', y)
    }
}

// Taskbar and clock
const taskbarItems = document.getElementById('taskbar-items');
const clock = document.getElementById('clock');

function updateClock() {
    clock.textContent = new Date().toLocaleTimeString();
}

setInterval(updateClock, 1000);

// Close button functionality
document.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        btn.closest('.window').style.display = 'none';
    });
});

// Responsive canvas
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Initial setup
if (window.innerWidth <= 768) {
    document.getElementById('terminal-window').classList.add('active');
}

sendLog('Script execution completed');
