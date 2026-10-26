package com.vayam.music;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class MlIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void testMlStatusEndpoint() throws Exception {
        mockMvc.perform(get("/api/recommendations/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mlApiUrl").isNotEmpty())
                .andExpect(jsonPath("$.engine").isNotEmpty());
    }

    @Test
    void testMlMoodRecommendationEndpoint() throws Exception {
        mockMvc.perform(get("/api/recommendations/mood/happy"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", not(empty())));
    }

    @Test
    void testSeededBollywoodSongs() throws Exception {
        // Verify Happy songs
        mockMvc.perform(get("/api/songs/mood/Happy"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].title", hasItems("Tum Hi Ho Bandhu", "Ilahi")));

        // Verify Sad songs
        mockMvc.perform(get("/api/songs/mood/Sad"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].title", hasItems("Tum Hi Ho", "Channa Mereya", "Agar Tum Saath Ho")));

        // Verify Energetic songs
        mockMvc.perform(get("/api/songs/mood/Energetic"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].title", hasItems("Galti Se Mistake", "Ghungroo")));

        // Verify Relaxed songs
        mockMvc.perform(get("/api/songs/mood/Relaxed"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].title", hasItems("Samjhawan", "Kesariya")));

        // Verify Focus songs
        mockMvc.perform(get("/api/songs/mood/Focus"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].title", hasItems("Naina", "Laal Ishq", "Sanam Re")));
    }
}
