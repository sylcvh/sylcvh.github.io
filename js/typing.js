document.addEventListener('DOMContentLoaded', function() {
    function typeWriter() {
        const textElement = document.getElementById('typing-text');
        const cursor = document.getElementById('typing-cursor');
        const text = "Sylco™";
        let i = 0;

        if (!textElement || !cursor) {
            return;
        }

        textElement.textContent = '';

        function type() {
            if (i < text.length) {
                textElement.textContent += text.charAt(i);
                i++;
                setTimeout(type, 150);
            } else {
                cursor.style.animation = 'blink 1s infinite';
            }
        }

        setTimeout(type, 500);
    }

    typeWriter();
});