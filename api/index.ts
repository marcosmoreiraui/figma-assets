import axios from 'axios'

const figmaRestApi = axios.create({
    baseURL:
        'https://api.figma.com/v1/',
    headers: {
        'X-Figma-Token': process.env.FIGMA_ACCESS_TOKEN
    }
})

export default figmaRestApi
