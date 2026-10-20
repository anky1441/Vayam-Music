package com.vayam.music;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class ApiControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private static String jwtToken;
    private static Long testSongId;
    private static Long createdPlaylistId;
    private static Long aliceUserId;

    @Test
    @Order(1)
    void testRegisterAndLogin() throws Exception {
        String uniqueEmail = "user_" + System.currentTimeMillis() + "@example.com";
        String regJson = """
            {
                "name": "Integration Tester",
                "email": "%s",
                "password": "securepassword123"
            }
        """.formatted(uniqueEmail);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(regJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.email", is(uniqueEmail)));

        // Login with newly created user
        String loginJson = """
            {
                "email": "%s",
                "password": "securepassword123"
            }
        """.formatted(uniqueEmail);

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andReturn();

        JsonNode node = objectMapper.readTree(loginResult.getResponse().getContentAsString());
        jwtToken = node.get("token").asText();

        // Also login as demo user to verify demo seeding
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {
                                "email": "demo@example.com",
                                "password": "password123"
                            }
                        """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email", is("demo@example.com")));

        // Get Alice user id
        MvcResult aliceResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {
                                "email": "alice@example.com",
                                "password": "password123"
                            }
                        """))
                .andExpect(status().isOk())
                .andReturn();
        aliceUserId = objectMapper.readTree(aliceResult.getResponse().getContentAsString()).get("userId").asLong();
    }

    @Test
    @Order(2)
    void testUserMe() throws Exception {
        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Integration Tester")));

        // Unauthenticated request should be 401
        mockMvc.perform(get("/api/users/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(3)
    void testSongEndpoints() throws Exception {
        // GET all songs
        MvcResult result = mockMvc.perform(get("/api/songs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThan(0))))
                .andReturn();

        JsonNode songs = objectMapper.readTree(result.getResponse().getContentAsString());
        testSongId = songs.get(0).get("id").asLong();

        // GET song by ID
        mockMvc.perform(get("/api/songs/" + testSongId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(testSongId.intValue())));

        // GET by mood
        mockMvc.perform(get("/api/songs/mood/Chill"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThan(0))));

        // GET by vibe
        mockMvc.perform(get("/api/songs/vibe/Study Cafe"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThan(0))));

        // GET by genre
        mockMvc.perform(get("/api/songs/genre/Electronic"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThan(0))));

        // Search songs
        mockMvc.perform(get("/api/songs").param("search", "Midnight"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThan(0))))
                .andExpect(jsonPath("$[0].title", containsString("Midnight")));
    }

    @Test
    @Order(4)
    void testLikesFlow() throws Exception {
        // Liked songs requires auth
        mockMvc.perform(get("/api/songs/liked"))
                .andExpect(status().isUnauthorized());

        // Like song
        mockMvc.perform(post("/api/songs/" + testSongId + "/like")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.liked", is(true)));

        // Check isLiked
        mockMvc.perform(get("/api/songs/" + testSongId + "/is-liked")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.liked", is(true)));

        // Get my liked songs
        mockMvc.perform(get("/api/songs/liked")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id", is(testSongId.intValue())));

        // Unlike song
        mockMvc.perform(delete("/api/songs/" + testSongId + "/like")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.liked", is(false)));

        // Verify liked list is now empty
        mockMvc.perform(get("/api/songs/liked")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @Order(5)
    void testRecommendationsFlow() throws Exception {
        // GET recommendations with query param
        mockMvc.perform(get("/api/recommendations").param("mood", "Energetic"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThan(0))));

        // GET recommendations by path
        mockMvc.perform(get("/api/recommendations/mood/Chill"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThan(0))));

        // POST recommendations with JSON body
        mockMvc.perform(post("/api/recommendations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {
                                "mood": "Focus",
                                "prompt": "deep work coding music"
                            }
                        """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThan(0))));

        // POST recommendations with likedSongId
        mockMvc.perform(post("/api/recommendations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {
                                "likedSongId": %d
                            }
                        """.formatted(testSongId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThan(0))));
    }

    @Test
    @Order(6)
    void testStorySongFlow() throws Exception {
        // JSON endpoint
        mockMvc.perform(post("/api/storysong/json")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {
                                "vibe": "Night Drive"
                            }
                        """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThan(0))));

        // Multipart endpoint
        MockMultipartFile photo = new MockMultipartFile("photo", "sunset.jpg", "image/jpeg", "fake-image-bytes".getBytes());
        mockMvc.perform(multipart("/api/storysong")
                        .file(photo)
                        .param("vibe", "Acoustic Sunset"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThan(0))));
    }

    @Test
    @Order(7)
    void testPlaylistCrudFlow() throws Exception {
        // Create playlist
        MvcResult createResult = mockMvc.perform(post("/api/playlists")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {
                                "name": "My Coding Playlist",
                                "description": "Tracks for late night programming"
                            }
                        """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("My Coding Playlist")))
                .andReturn();

        createdPlaylistId = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asLong();

        // Add song to playlist
        mockMvc.perform(post("/api/playlists/" + createdPlaylistId + "/songs/" + testSongId)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        // Get playlist by ID
        mockMvc.perform(get("/api/playlists/" + createdPlaylistId)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.songs", hasSize(1)));

        // Remove song from playlist
        mockMvc.perform(delete("/api/playlists/" + createdPlaylistId + "/songs/" + testSongId)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        // List my playlists
        mockMvc.perform(get("/api/playlists")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThan(0))));
    }

    @Test
    @Order(8)
    void testCollaborativePlaylistFlow() throws Exception {
        // Add Alice as a member
        mockMvc.perform(post("/api/shared-playlists/" + createdPlaylistId + "/members")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {
                                "userId": %d
                            }
                        """.formatted(aliceUserId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        // View members
        mockMvc.perform(get("/api/shared-playlists/" + createdPlaylistId + "/members")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id", is(aliceUserId.intValue())));

        // Alice adds a song to the collaborative playlist
        String aliceLogin = """
            {
                "email": "alice@example.com",
                "password": "password123"
            }
        """;
        MvcResult aliceAuth = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(aliceLogin))
                .andExpect(status().isOk())
                .andReturn();
        String aliceToken = objectMapper.readTree(aliceAuth.getResponse().getContentAsString()).get("token").asText();

        // Alice views shared playlists with her
        mockMvc.perform(get("/api/shared-playlists")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$[*].id", hasItem(createdPlaylistId.intValue())));

        // Alice adds song
        mockMvc.perform(post("/api/shared-playlists/" + createdPlaylistId + "/songs/" + testSongId)
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.songs", hasSize(1)));

        // Alice removes song
        mockMvc.perform(delete("/api/shared-playlists/" + createdPlaylistId + "/songs/" + testSongId)
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.songs", hasSize(0)));

        // Remove Alice from members
        mockMvc.perform(delete("/api/shared-playlists/" + createdPlaylistId + "/members/" + aliceUserId)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    @Order(9)
    void testGeneratePlaylistFlow() throws Exception {
        MvcResult genResult = mockMvc.perform(post("/api/playlists/generate")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {
                                "prompt": "Chill Sunset Vibe",
                                "name": "Generated Sunset Chill"
                            }
                        """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Generated Sunset Chill")))
                .andExpect(jsonPath("$.songs", hasSize(greaterThan(0))))
                .andReturn();

        Long generatedId = objectMapper.readTree(genResult.getResponse().getContentAsString()).get("id").asLong();

        // Delete generated playlist
        mockMvc.perform(delete("/api/playlists/" + generatedId)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        // Delete original playlist
        mockMvc.perform(delete("/api/playlists/" + createdPlaylistId)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }
}
