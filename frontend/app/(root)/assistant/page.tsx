"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { UserProfile } from "@/app/types/profile";
import { toast } from "sonner";
import { Button } from "@/components/ui/button"; 
import { AiCareerResponse } from "@/lib/recommendations";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AssistantPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recommendations, setRecommendations] = useState<AiCareerResponse | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedProfile = localStorage.getItem("userProfile");
    if (storedProfile) {
      setProfile(JSON.parse(storedProfile));
    } else {
      setError("Brak danych profilu. Wróć do formularza.");
    }
  }, []);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!profile) return;

      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication required", {
          description: "Please sign in to continue.",
        });
        setLoading(false);
        return;
      }

      try {
        try {
          const lastRecommendationResponse = await axios.get<AiCareerResponse>(
            "https://localhost:5001/api/AI/last-recommendation",
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          console.log("Ostatnie rekomendacje:", lastRecommendationResponse.data);
          setRecommendations(lastRecommendationResponse.data);
          setLoading(false);
          return; 
        } catch (lastError: any) {
          if (lastError.response?.status !== 404) {
            console.error("Błąd podczas pobierania ostatnich rekomendacji:", lastError);
            setError(
              lastError.response?.data?.detail || "Błąd podczas pobierania ostatnich rekomendacji."
            );
            setLoading(false);
            return;
          }
        }

        const response = await axios.get<AiCareerResponse>(
          "https://localhost:5001/api/AI/recommendations",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        console.log("Nowe rekomendacje:", response.data);
        setRecommendations(response.data);
      } catch (err: any) {
        console.error("Błąd podczas pobierania rekomendacji:", err);
        setError(
          err.response?.data?.detail || "Nie udało się pobrać rekomendacji."
        );
      } finally {
        setLoading(false);
      }
    };

    if (profile) {
      fetchRecommendations();
    }
  }, [profile]);

  if (!profile) {
    return <div>Brak danych profilu. Wróć do formularza.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <Link className="flex space-x-4 mb-4" href="/">
          <ArrowLeft />
          <span>Go back</span>
      </Link>
      <h1 className="text-2xl font-bold mb-4">
        Rekomendacje dla {profile.firstName} {profile.lastName}
      </h1>
      {error && <p className="text-red-500">{error}</p>}
      {isLoading ? (
        <p>Ładowanie rekomendacji...</p>
      ) : recommendations ? (
        <div>
          <h2 className="text-xl font-semibold mb-2">Rekomendacje:</h2>
          <div className="mb-6">
            <h3 className="text-lg font-medium">Główna ścieżka kariery:</h3>
            <p>
              <strong>{recommendations.recommendation.primaryPath}</strong>
            </p>
            <p>{recommendations.recommendation.justification}</p>
            <h4 className="mt-2 font-medium">Kolejne kroki:</h4>
            <ul className="list-disc pl-5">
              {recommendations.recommendation.nextSteps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ul>
            <h4 className="mt-2 font-medium">Cel długoterminowy:</h4>
            <p>{recommendations.recommendation.longTermGoal}</p>
          </div>

          <h3 className="text-lg font-medium mb-2">Proponowane ścieżki kariery:</h3>
          {recommendations.careerPaths.map((path, index) => (
            <div key={index} className="mb-4 p-4 border rounded-lg">
              <h4 className="font-medium">{path.careerName}</h4>
              <p>{path.description}</p>
              <p>
                <strong>Prawdopodobieństwo sukcesu:</strong> {path.probability}%
              </p>
              <h5 className="mt-2 font-medium">Wymagane umiejętności:</h5>
              <ul className="list-disc pl-5">
                {path.requiredSkills.map((skill, skillIndex) => (
                  <li key={skillIndex}>{skill}</li>
                ))}
              </ul>
              <h5 className="mt-2 font-medium">Analiza rynku:</h5>
              <ul className="list-disc pl-5">
                {path.marketAnalysis.map((analysis, analysisIndex) => (
                  <li key={analysisIndex}>{analysis}</li>
                ))}
              </ul>
              <h5 className="mt-2 font-medium">Rekomendowane kursy:</h5>
              <ul className="list-disc pl-5">
                {path.recommendedCourses.map((course, courseIndex) => (
                  <li key={courseIndex}>{course}</li>
                ))}
              </ul>
              <h5 className="mt-2 font-medium">Analiza SWOT:</h5>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>Mocne strony:</strong>
                  <ul className="list-disc pl-5">
                    {path.swot.strengths.map((strength, strengthIndex) => (
                      <li key={strengthIndex}>{strength}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <strong>Słabe strony:</strong>
                  <ul className="list-disc pl-5">
                    {path.swot.weaknesses.map((weakness, weaknessIndex) => (
                      <li key={weaknessIndex}>{weakness}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <strong>Szanse:</strong>
                  <ul className="list-disc pl-5">
                    {path.swot.opportunities.map((opportunity, oppIndex) => (
                      <li key={oppIndex}>{opportunity}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <strong>Zagrożenia:</strong>
                  <ul className="list-disc pl-5">
                    {path.swot.threats.map((threat, threatIndex) => (
                      <li key={threatIndex}>{threat}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}

          {recommendations && (
            <Button
              onClick={async () => {
                setLoading(true);
                const token = localStorage.getItem("token");
                if (!token) {
                  toast.error("Authentication required", {
                    description: "Please sign in to continue.",
                  });
                  setLoading(false);
                  return;
                }
                try {
                  const response = await axios.get<AiCareerResponse>(
                    "https://localhost:5001/api/AI/recommendations",
                    {
                      headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                      },
                    }
                  );
                  setRecommendations(response.data);
                } catch (err: any) {
                  setError(
                    err.response?.data?.detail || "Nie udało się wygenerować nowych rekomendacji."
                  );
                } finally {
                  setLoading(false);
                }
              }}
              disabled={isLoading}
              className="mt-4"
            >
              Wygeneruj nowe rekomendacje
            </Button>
          )}
        </div>
      ) : (
        <p>Brak rekomendacji.</p>
      )}
    </div>
  );
}