document.addEventListener('DOMContentLoaded', () => {
    const inputText = document.getElementById('inputText');
    const sendBtn = document.getElementById('sendBtn');
    const chatContainer = document.getElementById('chatContainer');
    const welcomeScreen = document.getElementById('welcomeScreen');
    const menuBtn = document.getElementById('menuBtn');
    const sidebar = document.querySelector('.sidebar');
    const newChatBtn = document.querySelector('.new-chat-btn');
    const eli5Toggle = document.getElementById('eli5Toggle');

    let isEli5Mode = true;

    eli5Toggle.addEventListener('click', () => {
        isEli5Mode = !isEli5Mode;
        if (isEli5Mode) {
            eli5Toggle.classList.add('active');
            eli5Toggle.querySelector('.toggle-text').textContent = 'ELI5 Mode';
        } else {
            eli5Toggle.classList.remove('active');
            eli5Toggle.querySelector('.toggle-text').textContent = 'Normal Mode';
        }
    });

    // Auto-resize textarea
    inputText.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        
        // Enable/disable send button
        sendBtn.disabled = this.value.trim() === '';
    });

    // Handle Enter key (Shift+Enter for new line)
    inputText.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!sendBtn.disabled) {
                sendMessage();
            }
        }
    });

    sendBtn.addEventListener('click', sendMessage);

    // Sidebar toggle for mobile
    menuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });

    // New chat
    newChatBtn.addEventListener('click', () => {
        // Clear chat container except welcome screen
        const messages = chatContainer.querySelectorAll('.message');
        messages.forEach(msg => msg.remove());
        
        welcomeScreen.style.display = 'flex';
        inputText.value = '';
        inputText.style.height = 'auto';
        sendBtn.disabled = true;
        
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('open');
        }
    });

    async function sendMessage() {
        const text = inputText.value.trim();
        if (!text) return;

        // Hide welcome screen
        welcomeScreen.style.display = 'none';

        // Add user message
        addUserMessage(text);

        // Reset input
        inputText.value = '';
        inputText.style.height = 'auto';
        sendBtn.disabled = true;

        // Add loading indicator
        const loadingId = addLoadingIndicator();

        try {
            const response = await fetch('/api/simplify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text, mode: isEli5Mode ? 'eli5' : 'normal' })
            });

            const data = await response.json();
            
            // Remove loading indicator
            removeElement(loadingId);

            if (!response.ok) {
                throw new Error(data.error || 'Failed to get explanation');
            }

            // Add AI message
            addAIMessage(data.explanation);
        } catch (error) {
            removeElement(loadingId);
            addAIMessage(`**Error:** ${error.message}\n\nPlease check if the server is running and the API key is configured correctly.`);
        }
    }

    function addUserMessage(text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message user';
        
        // Escape HTML for user input, then preserve line breaks
        const escapedText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        
        msgDiv.innerHTML = `
            <div class="message-content">
                ${escapedText}
            </div>
        `;
        
        chatContainer.appendChild(msgDiv);
        scrollToBottom();
    }

    function addAIMessage(text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message ai';
        
        // Use marked to parse markdown and DOMPurify to sanitize
        let cleanHtml = '';
        if (typeof marked !== 'undefined' && typeof DOMPurify !== 'undefined') {
            const rawHtml = marked.parse(text);
            cleanHtml = DOMPurify.sanitize(rawHtml);
        } else {
            // Fallback if CDNs failed
            cleanHtml = `<p>${text.replace(/\n/g, '<br>')}</p>`;
        }
        
        msgDiv.innerHTML = `
            <div class="avatar ai-avatar">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <div class="message-content">
                ${cleanHtml}
            </div>
        `;
        
        chatContainer.appendChild(msgDiv);
        scrollToBottom();
    }

    function addLoadingIndicator() {
        const id = 'loading-' + Date.now();
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message ai';
        msgDiv.id = id;
        
        msgDiv.innerHTML = `
            <div class="avatar ai-avatar">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <div class="message-content">
                <div class="typing-indicator">
                    <div class="dot"></div>
                    <div class="dot"></div>
                    <div class="dot"></div>
                </div>
            </div>
        `;
        
        chatContainer.appendChild(msgDiv);
        scrollToBottom();
        return id;
    }

    function removeElement(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    function scrollToBottom() {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
});
