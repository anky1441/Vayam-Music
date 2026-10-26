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
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class GoogleAuthIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private static String googleJwtToken;

    @Test
    @Order(1)
    void testGoogleConfigEndpoint() throws Exception {
        mockMvc.perform(get("/api/auth/google/config"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.configured").exists());
    }

    @Test
    @Order(2)
    void testGoogleLoginWithDevMockToken() throws Exception {
        String reqJson = """
            {
                "idToken": "dev-mock:Kavya Rao:kavya.rao@example.com"
            }
        """;

        MvcResult result = mockMvc.perform(post("/api/auth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reqJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.email", is("kavya.rao@example.com")))
                .andExpect(jsonPath("$.name", is("Kavya Rao")))
                .andExpect(jsonPath("$.provider", is("GOOGLE")))
                .andReturn();

        JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
        googleJwtToken = node.get("token").asText();
    }

    @Test
    @Order(3)
    void testAccessProtectedEndpointWithGoogleJwt() throws Exception {
        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer " + googleJwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email", is("kavya.rao@example.com")))
                .andExpect(jsonPath("$.name", is("Kavya Rao")))
                .andExpect(jsonPath("$.provider", is("GOOGLE")));
    }

    @Test
    @Order(4)
    void testGoogleLoginExistingUserLinking() throws Exception {
        // demo@example.com was seeded as LOCAL user in DataInitializer
        String reqJson = """
            {
                "idToken": "dev-mock:Demo User:demo@example.com"
            }
        """;

        mockMvc.perform(post("/api/auth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reqJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email", is("demo@example.com")))
                .andExpect(jsonPath("$.provider", is("GOOGLE")));
    }

    @Test
    @Order(5)
    void testGoogleLoginWithBlankToken() throws Exception {
        mockMvc.perform(post("/api/auth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {
                                "idToken": "  "
                            }
                        """))
                .andExpect(status().isBadRequest());
    }

    @Test
    @Order(6)
    void testGoogleLoginWithInvalidToken() throws Exception {
        mockMvc.perform(post("/api/auth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {
                                "idToken": "completely.fake.invalid.token"
                            }
                        """))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(7)
    void testGoogleLoginWithGisCredentialAlias() throws Exception {
        mockMvc.perform(post("/api/auth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {
                                "credential": "dev-mock:Vanshika Kesarwani:vanshika@example.com"
                            }
                        """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.email", is("vanshika@example.com")))
                .andExpect(jsonPath("$.name", is("Vanshika Kesarwani")));
    }

    @Test
    @Order(8)
    void testGoogleLoginWithSnakeCaseIdToken() throws Exception {
        mockMvc.perform(post("/api/auth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {
                                "id_token": "dev-mock:Ankit:ankit@example.com"
                            }
                        """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.email", is("ankit@example.com")));
    }

    @Test
    @Order(9)
    void testProfilePatchAndBioUpdate() throws Exception {
        // Authenticated user updates profile using PATCH (matching the user's mobile screen)
        String patchJson = """
            {
                "name": "Vanshika Kesarwani",
                "bio": "Dendrophile"
            }
        """;

        mockMvc.perform(patch("/api/users/me")
                        .header("Authorization", "Bearer " + googleJwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(patchJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Vanshika Kesarwani")))
                .andExpect(jsonPath("$.bio", is("Dendrophile")));

        // Verify GET /api/users/me returns updated bio
        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer " + googleJwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Vanshika Kesarwani")))
                .andExpect(jsonPath("$.bio", is("Dendrophile")));
    }

    @Test
    @Order(10)
    void testUserLikesEndpoint() throws Exception {
        mockMvc.perform(get("/api/users/me/likes")
                        .header("Authorization", "Bearer " + googleJwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @Order(11)
    void testSongSearchEndpoint() throws Exception {
        mockMvc.perform(get("/api/songs/search")
                        .param("query", "Sunset"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @Order(12)
    void testSongRecommendationEndpoint() throws Exception {
        mockMvc.perform(get("/api/recommendations/song/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }
}
