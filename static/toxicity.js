var configurableURL = "http://127.0.0.1:8000";
var letterCounter = 0;
var totalLetters = 0;
var latestAnswer = "";
if(sessionStorage.getItem("userMail")===null)
{
    window.location = "../login";
}
else
{
    document.getElementById("newName").innerHTML = window.sessionStorage.getItem("userName");
}
function logoutButtonClicked()
{
    window.sessionStorage.clear();
    window.location="../login";
}

const LETTER_POOL = getEl('letter-pool');
const TEMP_LETTER_POOL = getEl('temp-letter-pool');
const LETTER_OVERLAY = getEl('letter-overlay');
const CHAT_MESSAGE_COLUMN_WRAPPER = getEl('chat-message-column-wrapper');
const CHAT_MESSAGE_COLUMN = getEl('chat-message-column');
const MESSAGE_INPUT = getEl('message-input');
var lastUserContent = "";
const MESSAGE_INPUT_FIELD = getEl('message-input-field');
const STATE =
{
    isUserSendingMessage: false,
    isChatBotSendingMessage: false,
    letterPool: {
        transitionPeriod: 30000,
        intervals: []
    },
    chatbotMessageIndex: 0,
    nLetterSets: 4
};
const createLetter = (cName, val) => {
    const letter = document.createElement('div');
    addClass(letter, cName);
    setAttr(letter, 'data-letter', val);
    letter.innerHTML = val;
    return letter;
};
const getAlphabet = isUpperCase => {
    let letters = [];
    for (let i = 65; i <= 90; i++)
    {
        let val = String.fromCharCode(i),
        letter = null;
        if (!isUpperCase) val = val.toLowerCase();
        letter = createLetter('pool-letter', val);
        letters.push(letter);
    }
    return letters;
};
const startNewLetterPath = (letter, nextRand, interval) => {
    clearInterval(interval);
    nextRand = getRandExcept(1, 4, nextRand);
    let nextPos = getRandPosOffScreen(nextRand),
    transitionPeriod = STATE.letterPool.transitionPeriod,
    delay = getRand(0, STATE.letterPool.transitionPeriod),
    transition = `left ${transitionPeriod}ms linear ${delay}ms, top ${transitionPeriod}ms linear ${delay}ms, opacity 0.5s`;
  setElPos(letter, nextPos.x, nextPos.y);
  setStyle(letter, 'transition', transition);
  interval = setInterval(() => {
    startNewLetterPath(letter, nextRand, interval);
  }, STATE.letterPool.transitionPeriod + delay);
  STATE.letterPool.intervals.push(interval);
};
const setRandLetterPaths = letters => {
    for (let i = 0; i < letters.length; i++)
    {
        let letter = letters[i],
        startRand = getRand(1, 4),
        nextRand = getRandExcept(1, 4, startRand),
        startPos = getRandPosOffScreen(startRand),
        nextPos = getRandPosOffScreen(nextRand),
        transitionPeriod = STATE.letterPool.transitionPeriod,
        delay = getRand(0, STATE.letterPool.transitionPeriod) * -1,
        transition = `left ${transitionPeriod}ms linear ${delay}ms, top ${transitionPeriod}ms linear ${delay}ms, opacity 0.5s`;
        setElPos(letter, startPos.x, startPos.y);
        setStyle(letter, 'transition', transition);
        addClass(letter, 'invisible');
        LETTER_POOL.appendChild(letter);
        setTimeout(() =>
        {
            setElPos(letter, nextPos.x, nextPos.y);
            removeClass(letter, 'invisible');
            let interval = setInterval(() => {
                startNewLetterPath(letter, nextRand, interval);
            }, STATE.letterPool.transitionPeriod + delay);
        }, 1);
    }
};
const fillLetterPool = (nSets = 1) => {
    for (let i = 0; i < nSets; i++)
    {
        const lCaseLetters = getAlphabet(false), uCaseLetters = getAlphabet(true);
        setRandLetterPaths(lCaseLetters);
        setRandLetterPaths(uCaseLetters);
    }
};
const findMissingLetters = (letters, lCount, isUpperCase) => {
    let missingLetters = [];
    for (let i = 65; i <= 90; i++)
    {
        let val = isUpperCase ? String.fromCharCode(i) : String.fromCharCode(i).toLowerCase(), nLetter = letters.filter(letter => letter === val).length;
        if (nLetter < lCount)
        {
            let j = nLetter;
            while (j < lCount)
            {
                missingLetters.push(val);
                j++;
            }
        }
    }
    return missingLetters;
};
const replenishLetterPool = (nSets = 1) => {
    const poolLetters = LETTER_POOL.childNodes;
    let currentLetters = [], missingLetters = [], lettersToAdd = [];
    for (let i = 0; i < poolLetters.length; i++)
    {
        currentLetters.push(poolLetters[i].dataset.letter);
    }
    missingLetters = [...missingLetters, ...findMissingLetters(currentLetters, nSets, false)];
    missingLetters = [...missingLetters, ...findMissingLetters(currentLetters, nSets, true)];
    for (let i = 0; i < missingLetters.length; i++)
    {
        const val = missingLetters[i];
        lettersToAdd.push(createLetter('pool-letter', val));
    }
    setRandLetterPaths(lettersToAdd);
};
const clearLetterPool = () => {
    removeAllChildren(LETTER_POOL);
};
const scrollToBottomOfMessages = () => {
    CHAT_MESSAGE_COLUMN_WRAPPER.scrollTop = CHAT_MESSAGE_COLUMN_WRAPPER.scrollHeight;
};
const checkMessageColumnHeight = () => {
    if (CHAT_MESSAGE_COLUMN.clientHeight >= window.innerHeight)
    {
        removeClass(CHAT_MESSAGE_COLUMN, 'static');
    }
    else
    {
        addClass(CHAT_MESSAGE_COLUMN, 'static');
    }
};
const appendContentText = (contentText, text) => {
    for (let i = 0; i < text.length; i++)
    {
        const letter = document.createElement('span');
        letter.innerHTML = text[i];
        setAttr(letter, 'data-letter', text[i]);
        contentText.appendChild(letter);
    }
};
const createChatMessage = (text, isReceived) => {
    let message = document.createElement('div'), profileIcon = document.createElement('div'), icon = document.createElement('i'), content = document.createElement('div'), contentText = document.createElement('h1'), direction = isReceived ? 'received' : 'sent';
    let img = document.createElement("img");
    img.setAttribute("src", "../static/chatbot.png");
    img.setAttribute("width", "50");
    img.setAttribute("height", "50");
    addClass(content, 'content');
    addClass(content, 'invisible');
    addClass(contentText, 'text');
    addClass(contentText, 'invisible');
    appendContentText(contentText, text);
    content.appendChild(contentText);
    addClass(profileIcon, 'invisible');
    addClass(message, 'message');
    addClass(message, direction);
    if (isReceived)
    {
        addClass(profileIcon, 'profile-icon-2');
        profileIcon.appendChild(img);
        message.appendChild(profileIcon);
        message.appendChild(content);
    }
    else
    {
        addClass(profileIcon, 'profile-icon');
        profileIcon.appendChild(icon);
        addClass(icon, 'far');
        addClass(icon, 'fa-user');
        message.appendChild(content);
        message.appendChild(profileIcon);
    }
    return message;
};
const findLetterInPool = targetLetter => {
    let letters = LETTER_POOL.childNodes, foundLetter = null;
    for (let i = 0; i < letters.length; i++)
    {
        const nextLetter = letters[i];
        if (nextLetter.dataset.letter === targetLetter && !nextLetter.dataset.found)
        {
            foundLetter = letters[i];
            setAttr(foundLetter, 'data-found', true);
            break;
        }
    }
    return foundLetter;
};
const createOverlayLetter = val => {
    const overlayLetter = document.createElement('span');
    addClass(overlayLetter, 'overlay-letter');
    addClass(overlayLetter, 'in-flight');
    overlayLetter.innerHTML = val;
    return overlayLetter;
};
const removePoolLetter = letter => {
    addClass(letter, 'invisible');
    setTimeout(() => {
        removeChild(LETTER_POOL, letter);
    }, 500);
};
const setElPosFromRight = (el, x, y) => {
    setStyle(el, 'right', x + 'px');
    setStyle(el, 'top', y + 'px');
};
const animateOverlayLetter = (letter, contentText, finalPos, isReceived) => {
    removePoolLetter(letter);
    const initPos = letter.getBoundingClientRect(), overlayLetter = createOverlayLetter(letter.dataset.letter);
    if (isReceived)
    {
        setElPos(overlayLetter, initPos.left, initPos.top);
    }
    else
    {
        setElPosFromRight(overlayLetter, window.innerWidth - initPos.right, initPos.top);
    }
    LETTER_OVERLAY.appendChild(overlayLetter);
    setTimeout(() => {
        if (isReceived)
        {
            setElPos(overlayLetter, finalPos.left, finalPos.top);
        }
        else
        {
            setElPosFromRight(overlayLetter, window.innerWidth - finalPos.right, finalPos.top);
        }
        setTimeout(() =>
        {
            removeClass(contentText, 'invisible');
            addClass(overlayLetter, 'invisible');
            setTimeout(() => {
                letterCounter += 1;
                if (letterCounter === totalLetters) 
                {
                    letterCounter = 0;
                    console.log(latestAnswer);
                    document.querySelectorAll(".message.received:last-of-type .text")[0].innerHTML = latestAnswer;
                }
                removeChild(LETTER_OVERLAY, overlayLetter);
            }, 1000);
        }, 1500);
    }, 100);
};
const animateMessageLetters = (message, isReceived) => {
    const content = message.getElementsByClassName('content')[0], contentText = content.getElementsByClassName('text')[0], letters = contentText.childNodes, textPos = contentText.getBoundingClientRect();
    for (let i = 0; i < letters.length; i++)
    {
        const letter = letters[i], targetLetter = findLetterInPool(letter.dataset.letter), finalPos = letter.getBoundingClientRect();
        if (targetLetter)
        {
            animateOverlayLetter(targetLetter, contentText, finalPos, isReceived);
        }
        else
        {
            const tempLetter = createLetter('temp-letter', letter.dataset.letter), pos = getRandPosOffScreen();
            addClass(tempLetter, 'invisible');
            setElPos(tempLetter, pos.x, pos.y);
            TEMP_LETTER_POOL.appendChild(tempLetter);
            animateOverlayLetter(tempLetter, contentText, finalPos, isReceived);
            setTimeout(() => {
                removeChild(TEMP_LETTER_POOL, tempLetter);
            }, 100);
        }
    }
};
const addChatMessage = (text, isReceived) => {
    const message = createChatMessage(text, isReceived), content = message.getElementsByClassName('content')[0], contentText = content.getElementsByClassName('text')[0], profileIcon = message.getElementsByClassName('profile-icon')[0], profileIcon2 = message.getElementsByClassName('profile-icon-2')[0];
    CHAT_MESSAGE_COLUMN.appendChild(message);
    toggleInput();
    setTimeout(() => {
        if(profileIcon!==undefined)
        {
            removeClass(profileIcon, 'invisible');
        }
        else
        {
            removeClass(profileIcon2, 'invisible');
        }
        setTimeout(() => {
            removeClass(content, 'invisible');
            setTimeout(() => {
                animateMessageLetters(message, isReceived);
                setTimeout(() => replenishLetterPool(STATE.nLetterSets), 2500);
            }, 1000);
        }, 250);
    }, 250);
};
const checkIfInputFieldHasVal = () => MESSAGE_INPUT_FIELD.value.length > 0;
const clearInputField = () => {
    MESSAGE_INPUT_FIELD.value = '';
};
const disableInputField = () => {
    MESSAGE_INPUT_FIELD.blur();
    MESSAGE_INPUT_FIELD.value = '';
    MESSAGE_INPUT_FIELD.readOnly = true;
};
const enableInputField = () => {
    MESSAGE_INPUT_FIELD.readOnly = false;
    MESSAGE_INPUT_FIELD.focus();
};
const getChatbotMessageText = async () => {
    if (STATE.chatbotMessageIndex === 0)
    {
        totalLetters = 116;
        latestAnswer = "Hello. Welcome to NeutralNote - content toxicity checker. Please send a text in which you want to detect toxicity...";
        return "Hello. Welcome to NeutralNote - content toxicity checker. Please send a text in which you want to detect toxicity...";
    }
    else
    {
        var answer = "";
        var answer2 = "";
        await $.post(configurableURL+"/checkToxicity/",
            JSON.stringify({"token":window.sessionStorage.getItem("token"), "text": lastUserContent}),function(response){
                if(response.hasOwnProperty("Message"))
                {
                    alert(response.Message);
                    if(response.Message==="Session Expired")
                    {
                        logoutButtonClicked();
                    }
                    return;
                }
                
                for(var item of response.result) 
                {
                    answer = answer + 
                    `
                    <p class="sentence" title="${item.category}">${item.original_sentence}</p>
                    <br>
                    <p class="rephrased">${item.rephrased_sentence}</p>
                    `;
                    answer2 = answer2 + 
                    `${item.original_sentence}${item.category}${item.rephrased_sentence}`
                }
                
            }
            
        );
        totalLetters = answer2.length;
        latestAnswer = answer;
        return answer2;
    }
};
const sendChatbotMessage = () => {
    getChatbotMessageText().then(text => {
        STATE.isChatBotSendingMessage = true;
        addChatMessage(text, true);
        STATE.chatbotMessageIndex++;
        setTimeout(() => {
            STATE.isChatBotSendingMessage = false;
            toggleInput();
        }, 4000);
    });
};
const sendUserMessage = () => {
    const text = MESSAGE_INPUT_FIELD.value;
    lastUserContent = text;
    STATE.isUserSendingMessage = true;
    addChatMessage(text, false);
    setTimeout(() => {
        STATE.isUserSendingMessage = false;
        toggleInput();
    }, 4000);
};
const onEnterPress = e => {
    sendUserMessage();
    setTimeout(() => {
        sendChatbotMessage();
    }, 4000);
    toggleInput();
    clearInputField();
};
const initLetterPool = () => {
    clearLetterPool();
    fillLetterPool(STATE.nLetterSets);
};
const init = () => {
    initLetterPool();
    sendChatbotMessage();
    toggleInput();
};
let resetTimeout = null;
const resetLetterPool = () => {
    const intervals = STATE.letterPool.intervals;
    for (let i = 0; i < intervals.length; i++)
    {
        clearInterval(intervals[i]);
    }
    clearTimeout(resetTimeout);
    clearLetterPool();
    resetTimeout = setTimeout(() => {
        initLetterPool();
    }, 200);
};
const toggleInput = () => {
    if (checkIfInputFieldHasVal() && canSendMessage())
    {
        addClass(MESSAGE_INPUT, 'send-enabled');
    }
    else
    {
        removeClass(MESSAGE_INPUT, 'send-enabled');
    }
};
const isValidLetter = e => {
    return !e.ctrlKey && e.key !== 'Enter' && e.keyCode !== 8 && e.keyCode !== 9 && e.keyCode !== 13;
};
const canSendMessage = () => !STATE.isUserSendingMessage && !STATE.isChatBotSendingMessage;
MESSAGE_INPUT_FIELD.onkeypress = e => {
    if (checkIfInputFieldHasVal() && e.key === 'Enter')
    {
        removeClass(MESSAGE_INPUT, 'send-enabled');
        if (canSendMessage())
        {
            onEnterPress(e);
        }
    }
};
MESSAGE_INPUT_FIELD.onkeyup = () => {
    toggleInput();
};
MESSAGE_INPUT_FIELD.oncut = () => toggleInput();
window.onload = () => init();
window.onfocus = () => resetLetterPool();
window.onresize = _.throttle(resetLetterPool, 200);