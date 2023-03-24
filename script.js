const songUrls = {};

fetch('./songs/')
  .then(response => response.text())
  .then(html => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const links = doc.querySelectorAll('a');

    for (const link of links) {
      const fileName = link.href.split('/').pop();
      if (fileName.endsWith('.mp3')) {
        const srtFileName = fileName.replace('.mp3', '.srt');
        songUrls[decodeURIComponent(fileName)] = decodeURIComponent(srtFileName);
      }
    }

    // Add buttons to the song list dropdown
    const songListDropdown = document.getElementById('song-list');
    for (const songUrl of Object.keys(songUrls)) {
      const button = document.createElement('button');
      button.textContent = songUrl.replace('.mp3', '');
      button.onclick = () => switchSong(songUrl);
      songListDropdown.appendChild(button);
    }

    // Click the first song button by default
    const firstButton = document.querySelector('#song-list button');
    if (firstButton) {
      firstButton.click();
    }
  });

let intervalId;

function switchSong(songFilename) {
  console.log(songFilename);
  const audio = document.getElementById('audio');
  const lyrics = document.getElementById('lyrics');
  audio.src = `songs/${songFilename}`;
  console.log(audio.src);

  // clear the previous interval
  clearInterval(intervalId);

  fetch('songs/' + songUrls[songFilename])
    .then(response => response.text(console.log(response.url)))
    .then(data => {
      const srt = data.split(/\n\s*\n/).filter(Boolean).map(item => {
        const [id, time, ...textLines] = item.trim().split('\n');
        const [start, end] = time.split(' --> ').map(convertSrtTimeToSeconds);
        return { id: parseInt(id), start, end, text: textLines.join(' ') };
      });

      // assign the interval to the intervalId variable
      intervalId = setInterval(() => {
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
    });
}
function convertSrtTimeToSeconds(time) {
  const [hours, minutes, seconds] = time.split(':').map(parseFloat);
  return hours * 3600 + minutes * 60 + seconds;
}

const audioWrapper = document.getElementById('audio-wrapper');
let timerId;

if (audioWrapper) {
  audioWrapper.addEventListener('mouseenter', () => {
    clearTimeout(timerId);
  });

  audioWrapper.addEventListener('mouseleave', () => {
    timerId = setTimeout(() => {
      document.getElementById('audio').controls = false;
    }, 3000);
  });
}

function activateAudioOnMouseMove() {
  // Get the audio element
  const audio = document.getElementById('audio');

  // Add a mousemove event listener to the body
  document.body.addEventListener('mousemove', function () {
    // Show the audio controls by adding a class to the audio element
    audio.classList.add('show-controls');

    // Set a timeout to hide the audio controls after 3 seconds
    setTimeout(function () {
      audio.classList.remove('show-controls');
    }, 3000);

    // Hide the dropdown button by adding a class to the dropdown element
    const dropdown = document.querySelector('.dropdown');
    dropdown.classList.remove('hide-controls');

    // Set a timeout to show the dropdown button after 3 seconds
    setTimeout(function () {
      dropdown.classList.add('hide-controls');
    }, 3000);
  });
}
