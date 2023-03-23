fetch('song.srt')
  .then(response => response.text())
  .then(data => {
    const srt = data.split(/\n\s*\n/).filter(Boolean).map(item => {
      const [id, time, ...textLines] = item.trim().split('\n');
      const [start, end] = time.split(' --> ').map(convertSrtTimeToSeconds);
      return { id: parseInt(id), start, end, text: textLines.join(' ') };
    });
    const audio = document.getElementById('audio');
    const lyrics = document.getElementById('lyrics');
    let currentLyrics = srt[0].text;
    setInterval(() => {
      const currentTime = audio.currentTime;
      const currentSrt = srt.find(item => item.start <= currentTime && item.end >= currentTime);
      if (currentSrt) {
        const currentIndex = srt.findIndex(item => item.id === currentSrt.id);
        const nextLyrics = srt.slice(currentIndex + 1, currentIndex + 4).map(item => item.text);
        const currentAndNextLyrics = [currentSrt.text, ...nextLyrics].join(' ');
        lyrics.innerHTML = srt.map((item, index) => `<div class="lyric ${index === currentIndex ? 'active' : ''}">${item.text.replace(/<br>/g, '')}</div>`).join('');
        const lyricsContainer = document.getElementById('lyrics-container');
        const currentLyric = lyrics.querySelector('.lyric.active');
        const scrollY = currentLyric.offsetTop - lyricsContainer.offsetHeight / 2 + currentLyric.offsetHeight / 2;
        lyricsContainer.scrollTo({ top: scrollY, behavior: 'smooth' });
      }
    }, 100);

    function convertSrtTimeToSeconds(time) {
      const [hours, minutes, seconds] = time.split(':').map(parseFloat);
      return hours * 3600 + minutes * 60 + seconds;
    }
  });