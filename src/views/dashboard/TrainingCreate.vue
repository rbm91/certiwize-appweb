<script setup>
import { useRoute } from 'vue-router';

const route = useRoute();
const id = route.params.id;
</script>

<template>
    <div class="p-8">
        <h1 class="text-3xl font-bold text-red-600">TEST COMPOSANT TRAINING CREATE</h1>
        <p class="mt-4 text-lg">Mode: {{ id ? 'EDITION' : 'CREATION' }}</p>
        <p v-if="id" class="mt-2 text-gray-600">ID: {{ id }}</p>
        <p class="mt-2 text-green-600 font-bold">Si vous voyez ce texte, le composant se monte correctement.</p>
    </div>
</template>
