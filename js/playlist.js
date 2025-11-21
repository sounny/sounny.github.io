(function () {
  const section = document.getElementById("lessons");
  if (!section) return;

  const playlistWrapper = section.querySelector(".youtube-playlist");
  const grid = section.querySelector(".video-grid");
  const statusEl = section.querySelector(".playlist-status");

  if (!playlistWrapper || !grid || !statusEl) return;

  const playlistId = (playlistWrapper.dataset.playlistId || "").trim();
  const apiKey = (window.YOUTUBE_API_KEY || playlistWrapper.dataset.youtubeApiKey || "").trim();
  const maxResults = 50;
  const topLimit = 12;

  const formatNumber = (value) =>
    new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);

  const truncate = (text, length = 150) => {
    if (!text) return "";
    return text.length > length ? `${text.slice(0, length).trim()}…` : text;
  };

  const setStatus = (message, variant = "info") => {
    statusEl.textContent = message;
    statusEl.classList.remove("d-none", "alert-info", "alert-warning", "alert-danger", "alert-success");
    statusEl.classList.add(`alert-${variant}`);
  };

  const clearStatus = () => {
    statusEl.classList.add("d-none");
    statusEl.textContent = "";
  };

  const chunk = (arr, size) => {
    const result = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  };

  const fetchPlaylistItems = async () => {
    let pageToken = "";
    const items = [];

    while (items.length < maxResults) {
      const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
      url.searchParams.set("part", "contentDetails,snippet");
      url.searchParams.set("playlistId", playlistId);
      url.searchParams.set("maxResults", "50");
      url.searchParams.set("key", apiKey);
      if (pageToken) {
        url.searchParams.set("pageToken", pageToken);
      }

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`);
      }

      const data = await response.json();
      if (!Array.isArray(data.items)) break;

      items.push(
        ...data.items.map((item) => ({
          videoId: item?.contentDetails?.videoId,
          title: item?.snippet?.title || "Untitled video",
          description: item?.snippet?.description || "",
          publishedAt: item?.contentDetails?.videoPublishedAt,
          thumbnail:
            item?.snippet?.thumbnails?.maxres?.url ||
            item?.snippet?.thumbnails?.standard?.url ||
            item?.snippet?.thumbnails?.high?.url ||
            item?.snippet?.thumbnails?.medium?.url ||
            item?.snippet?.thumbnails?.default?.url ||
            "",
        }))
      );

      if (!data.nextPageToken || items.length >= maxResults) break;
      pageToken = data.nextPageToken;
    }

    return items.filter((item) => Boolean(item.videoId));
  };

  const fetchVideoStats = async (videoIds) => {
    const chunks = chunk(videoIds, 50);
    const allStats = new Map();

    for (const group of chunks) {
      const url = new URL("https://www.googleapis.com/youtube/v3/videos");
      url.searchParams.set("part", "statistics,snippet");
      url.searchParams.set("id", group.join(","));
      url.searchParams.set("key", apiKey);

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`);
      }

      const data = await response.json();
      (data.items || []).forEach((item) => {
        const stats = item.statistics || {};
        const snippet = item.snippet || {};
        allStats.set(item.id, {
          viewCount: Number(stats.viewCount) || 0,
          publishedAt: snippet.publishedAt,
        });
      });
    }

    return allStats;
  };

  const renderCards = (videos) => {
    grid.innerHTML = "";
    const fragment = document.createDocumentFragment();

    videos.forEach((video) => {
      const col = document.createElement("div");
      col.className = "col-lg-4 col-md-6 d-flex";

      const card = document.createElement("div");
      card.className = "video-card";

      const thumb = document.createElement("div");
      thumb.className = "video-thumb";
      const img = document.createElement("img");
      img.src = video.thumbnail;
      img.alt = video.title;
      img.loading = "lazy";
      thumb.appendChild(img);

      const badge = document.createElement("div");
      badge.className = "view-badge";
      badge.textContent = `${formatNumber(video.viewCount)} views`;
      thumb.appendChild(badge);

      const body = document.createElement("div");
      body.className = "video-body";

      const title = document.createElement("h3");
      title.className = "video-title";
      title.textContent = video.title;

      const desc = document.createElement("p");
      desc.className = "video-description";
      desc.textContent = truncate(video.description);

      const meta = document.createElement("div");
      meta.className = "video-meta";
      if (video.publishedAt) {
        const datePill = document.createElement("span");
        datePill.className = "pill";
        const publishedDate = new Date(video.publishedAt);
        datePill.textContent = `Published ${publishedDate.toLocaleDateString()}`;
        meta.appendChild(datePill);
      }

      const rank = document.createElement("span");
      rank.className = "pill";
      rank.textContent = `Top ${video.rank}`;
      meta.appendChild(rank);

      const actions = document.createElement("div");
      actions.className = "video-actions";
      const watchButton = document.createElement("a");
      watchButton.className = "btn btn-primary btn-block";
      watchButton.href = `https://www.youtube.com/watch?v=${video.videoId}&list=${playlistId}`;
      watchButton.target = "_blank";
      watchButton.rel = "noopener noreferrer";
      watchButton.textContent = "Watch on YouTube";
      actions.appendChild(watchButton);

      body.appendChild(title);
      body.appendChild(desc);
      body.appendChild(meta);
      body.appendChild(actions);

      card.appendChild(thumb);
      card.appendChild(body);
      col.appendChild(card);
      fragment.appendChild(col);
    });

    grid.appendChild(fragment);
  };

  const buildPlaylist = async () => {
    if (!playlistId) {
      setStatus("Playlist ID is missing.", "danger");
      return;
    }

    if (!apiKey) {
      setStatus("Add your YouTube Data API key to load the latest videos.", "warning");
      return;
    }

    try {
      setStatus("Loading playlist videos…", "info");
      const playlistItems = await fetchPlaylistItems();
      if (!playlistItems.length) {
        setStatus("No videos were found for this playlist.", "warning");
        return;
      }

      const statsMap = await fetchVideoStats(playlistItems.map((item) => item.videoId));
      const enriched = playlistItems.map((item) => ({
        ...item,
        viewCount: statsMap.get(item.videoId)?.viewCount || 0,
        publishedAt: statsMap.get(item.videoId)?.publishedAt || item.publishedAt,
      }));

      enriched.sort((a, b) => b.viewCount - a.viewCount);
      const topVideos = enriched.slice(0, topLimit).map((video, index) => ({
        ...video,
        rank: index + 1,
      }));

      renderCards(topVideos);
      clearStatus();
    } catch (error) {
      console.error(error);
      setStatus("We couldn't load the playlist right now. Please try again later.", "danger");
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildPlaylist);
  } else {
    buildPlaylist();
  }
})();
