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
        const txtFileName = fileName.replace('.mp3', '.txt');
        songUrls[decodeURIComponent(fileName)] = { srt: decodeURIComponent(srtFileName), txt: decodeURIComponent(txtFileName) };
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

  const srtFilename = songUrls[songFilename].srt;
  const srtUrl = `songs/${srtFilename}`;
  const txtUrl = `songs/${songFilename.replace('.mp3', '.txt')}`;

  let url;
  let fileType;

  fetch(srtUrl)
    .then(response => {
      if (response.status === 404) {
        fileType = 'txt';
        url = txtUrl;
        return fetch(txtUrl);
      } else {
        fileType = 'srt';
        url = srtUrl;
        return response.text();
      }
    })
    .then(data => {
      if (fileType === 'srt') {
        // Parse the SRT file
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
            lyrics.innerHTML = srt.map((item, index) => `<div class="lyric ${index === currentIndex ? 'active' : ''}">${item.text.replace(/<br>/g, '')}</div>`).join('');
            const lyricsContainer = document.getElementById('lyrics-container');
            const currentLyric = lyrics.querySelector('.lyric.active');
            const scrollY = currentLyric.offsetTop - lyricsContainer.offsetHeight / 2 + currentLyric.offsetHeight / 2;
            const behavior = audio.paused ? 'instant' : 'smooth';
            lyricsContainer.scrollTo({ top: scrollY, behavior });
          }
        }, 100);
      } else if (fileType === 'txt') {
        // Load the text file content into the template
        return fetch(url).then(response => response.text());
      }
    })
    .then(response => {
      if (fileType === 'txt') {
        // Render the text file content in the template
        lyrics.innerHTML = response.split('\n').map(line => `<div class="lyric">${line.trim()}</div>`).join('');
        
        // synchronize the scrolling with audio time
        intervalId = setInterval(() => {
          const currentTime = audio.currentTime;
          const totalDuration = audio.duration;
          const progressPercentage = (currentTime / totalDuration) * 100;
          const lyricsContainer = document.getElementById('lyrics-container');
          const containerHeight = lyricsContainer.offsetHeight;
          const lyricsHeight = lyrics.offsetHeight;
          const scrollY = (progressPercentage / 100) * (lyricsHeight - containerHeight);
          const behavior = audio.paused ? 'instant' : 'smooth';
          lyricsContainer.scrollTo({ top: scrollY, behavior });
        }, 100);
      }
    })
    .catch(error => console.error(error));
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
