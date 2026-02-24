<script setup>
import { computed } from 'vue';

const props = defineProps({
  src: {
    type: String,
    required: true,
    validator: (value) => {
      // Support YouTube, Vimeo, or direct video URLs
      return value.includes('youtube.com') ||
             value.includes('youtu.be') ||
             value.includes('vimeo.com') ||
             value.includes('.mp4') ||
             value.includes('.webm');
    }
  },
  title: {
    type: String,
    default: 'Video'
  }
});

const embedUrl = computed(() => {
  const url = props.src;

  // YouTube
  if (url.includes('youtube.com/watch')) {
    const videoId = url.split('v=')[1]?.split('&')[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }

  if (url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1]?.split('?')[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }

  // Vimeo
  if (url.includes('vimeo.com/')) {
    const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
    return `https://player.vimeo.com/video/${videoId}`;
  }

  // Direct video URL
  return url;
});

const isDirectVideo = computed(() => {
  return props.src.includes('.mp4') || props.src.includes('.webm');
});
</script>

<template>
  <div class="aspect-video rounded-lg overflow-hidden shadow-lg bg-gray-900">
    <!-- Direct video file -->
    <video
      v-if="isDirectVideo"
      :src="src"
      controls
      class="w-full h-full object-cover"
      :title="title"
    >
      Your browser does not support the video tag.
    </video>

    <!-- YouTube / Vimeo embed -->
    <iframe
      v-else
      :src="embedUrl"
      :title="title"
      class="w-full h-full"
      frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen
    ></iframe>
  </div>
</template>
