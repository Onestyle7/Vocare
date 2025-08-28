'use client';

import { RecommendationApiError, useRecommendationsApi } from '@/lib/api/RecommendationApiServiice';
import { AiCareerResponse } from '@/lib/types/recommendation';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { ChartLineLabel } from '../charts/LineCharts.tsx/LineChartAI-2';

const NewAssistantComponent = () => {
  const [recommendations, setRecommendations] = useState<AiCareerResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const api = useRecommendationsApi();

  // Automatyczne ładowanie rekomendacji przy montowaniu komponentu
  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await api.getRecommendationsWithFallback();
      setRecommendations(data);
    } catch (err) {
      if (err instanceof RecommendationApiError) {
        if (err.code === 'BILLING_INFO_MISSING') {
          setError('billing_info_missing');
        } else {
          setError(err.message);
        }
      } else {
        setError('Unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const generateNew = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await api.generateNewRecommendation();
      setRecommendations(data);
    } catch (err) {
      if (err instanceof RecommendationApiError) {
        setError(err.message);
      } else {
        setError('Unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="mx-auto mt-10 flex h-screen max-w-7xl flex-col items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-white"></div>
        <p className="mt-4 text-white">Loading recommendations...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="mx-auto mt-10 flex h-screen max-w-7xl flex-col items-center justify-center">
        <p className="mb-4 text-red-400">Error: {error}</p>
        <button
          onClick={loadRecommendations}
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-10 flex h-screen max-w-7xl flex-col">
      <div className="flex w-full flex-col items-center justify-center">
        <p className="font-korbin flex h-[38px] w-[180px] items-center justify-center rounded-full border-1 border-white/60 text-sm">
          AI Career Advisor
        </p>

        <div className="font-korbin mt-6 mb-8 flex w-full flex-col items-center justify-center space-y-4">
          <div className="flex w-full flex-col items-center justify-center px-4 max-sm:space-y-4 sm:flex-row md:space-x-4 lg:px-24">
            <div className="flex h-[516px] w-full flex-col items-center justify-start rounded-2xl border p-4 lg:w-1/2">
              <div className="flex h-1/2 w-full flex-col items-center justify-start">
                <div className="flex w-full flex-col items-center justify-center">
                  <div className="flex w-full flex-row items-center justify-between">
                    <p className="flex h-[48px] w-[48px] items-center justify-center rounded-xl border text-sm">
                      1
                    </p>
                    <div className="flex flex-col items-end">
                      <p className="flex items-center justify-center rounded-xl text-sm text-gray-300">
                        Main recommendation
                      </p>
                      <h3 className="font-poppins flex w-full items-center justify-end text-xs font-semibold sm:text-[1rem]">
                        {recommendations
                          ? recommendations.recommendation.primaryPath
                          : 'No recommendations available'}
                      </h3>
                    </div>
                  </div>
                  <div className="mt-2 flex h-full w-full flex-col items-center justify-center">
                    {recommendations ? (
                      <p className="font-poppins mt-2 text-start text-xs text-gray-600 sm:text-sm">
                        {recommendations.recommendation.justification}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500">No recommendations available</p>
                    )}
                  </div>
                </div>

                {/* ZMAPOWANE GŁÓWNE REKOMENDACJE */}
                {/* <div className="w-full border h-auto min-h-[40px] p-3 rounded-lg mt-4 bg-gray-50">
                  {recommendations ? (
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg text-blue-600">
                        {recommendations.recommendation.primaryPath}
                      </h3>
                      <p className="text-gray-700 text-sm">
                        {recommendations.recommendation.justification}
                      </p>
                      <div className="mt-3">
                        <h4 className="font-medium text-sm text-gray-800">Next Steps:</h4>
                        <ul className="list-disc list-inside text-xs text-gray-600 mt-1">
                          {recommendations.recommendation.nextSteps.map((step, index) => (
                            <li key={index} className="mt-1">{step}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="mt-3 p-2 bg-blue-50 rounded">
                        <h4 className="font-medium text-sm text-blue-800">Long-term Goal:</h4>
                        <p className="text-xs text-blue-700">
                          {recommendations.recommendation.longTermGoal}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No recommendations available</p>
                  )}
                </div> */}
                <div className="h-full w-full flex-col">
                  <div className="w-hull flex h-[36px] flex-col items-center justify-end"></div>
                </div>
              </div>
              <div className="relative flex h-1/2 w-full items-center justify-center overflow-hidden rounded-xl border">
                <Image
                  src="/images/cone.png"
                  alt="mockup"
                  width={148}
                  height={148}
                  className="absolute top-0 -left-14 transition-all hover:scale-110"
                />
                <Image
                  src="/images/cone-2.png"
                  alt="mockup"
                  width={148}
                  height={148}
                  className="absolute -right-14 bottom-0 -rotate-12 transition-all hover:scale-110"
                />
                {/* <div className="text-center z-10">
                  <button 
                    onClick={generateNew}
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                  >
                    {isLoading ? 'Generating...' : 'Generate New'}
                  </button>
                </div> */}
              </div>
            </div>
            <div className="flex h-[516px] w-full flex-col items-start justify-start overflow-hidden rounded-2xl border lg:w-1/2">
              <div className="flex h-[60%] w-full items-start justify-center p-4">
                <div className="flex w-full items-center justify-between">
                  <p className="flex h-[48px] w-[48px] items-center justify-center rounded-xl border text-sm">
                    2
                  </p>
                  <p className="flex items-center justify-center rounded-xl text-sm text-gray-300">
                    Next steps
                  </p>
                </div>

                {/* PIERWSZA ALTERNATYWNA ŚCIEŻKA */}
                {/* {recommendations && recommendations.careerPaths[0] && (
                  <div className="w-full mt-4 p-3 border rounded-lg bg-gray-50">
                    <h4 className="font-semibold text-blue-600 text-sm">
                      {recommendations.careerPaths[0].careerName}
                    </h4>
                    <p className="text-xs text-gray-600 mt-1">
                      {recommendations.careerPaths[0].description.substring(0, 100)}...
                    </p>
                    <div className="flex justify-between mt-2 text-xs">
                      <span className="text-green-600">
                        Probability: {Math.round(recommendations.careerPaths[0].probability * 100)}%
                      </span>
                      <span className="text-orange-600">
                        {recommendations.careerPaths[0].requiredSkills.length} skills needed
                      </span>
                    </div>
                  </div>
                )} */}
              </div>
              <div className="-mt-20 h-full items-center justify-center px-4">
                {recommendations?.recommendation?.nextSteps?.length ? (
  <ol className="font-poppins mt-1 list-inside list-decimal text-sm text-gray-600">
    {recommendations.recommendation.nextSteps.map((step, index) => (
      <li key={index} className="mt-1">
        {step}
      </li>
    ))}
  </ol>
) : null}

              </div>

              <div className="flex h-[40%] w-full items-start justify-center overflow-hidden border-t p-4 transition-all hover:-translate-y-32">
                <div className="flex w-full items-center justify-between">
                  <p className="flex h-[48px] w-[48px] items-center justify-center rounded-xl border text-sm">
                    3
                  </p>
                  <p className="flex items-center justify-center rounded-xl text-sm text-gray-300">
                    Long term goal
                  </p>
                </div>

                {/* DRUGA ALTERNATYWNA ŚCIEŻKA */}
                {/* {recommendations && recommendations.careerPaths[1] && (
                  <div className="w-full mt-4 p-3 border rounded-lg bg-gray-50">
                    <h4 className="font-semibold text-blue-600 text-sm">
                      {recommendations.careerPaths[1].careerName}
                    </h4>
                    <p className="text-xs text-gray-600 mt-1">
                      {recommendations.careerPaths[1].description.substring(0, 80)}...
                    </p>
                    <div className="flex justify-between mt-2 text-xs">
                      <span className="text-green-600">
                        Probability: {Math.round(recommendations.careerPaths[1].probability * 100)}%
                      </span>
                      <span className="text-orange-600">
                        {recommendations.careerPaths[1].requiredSkills.length} skills needed
                      </span>
                    </div>
                  </div>
                )} */}
              </div>
              {recommendations?.recommendation?.longTermGoal?.trim() ? (
                <div className="mt-3 rounded p-2">
                  <h4 className="text-sm font-medium text-white">Long-term Goal:</h4>
                  <p className="text-xs text-white">
                    {recommendations.recommendation.longTermGoal}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
          <div className="flex w-full flex-col items-center justify-center px-4 max-sm:space-y-4 sm:flex-row md:space-x-4 lg:px-24">
            <div className="flex h-[416px] w-full flex-col space-y-4 rounded-2xl lg:w-[35%]">
              <div className="flex h-1/3 w-full flex-row items-center justify-center space-x-4">
                <div className="flex h-full w-1/2 items-center justify-center rounded-2xl border">
                  <div className="flex h-full w-full items-center justify-center">
                    <ChartLineLabel />
                  </div>
                </div>
                <div className="flex h-full w-1/2 items-center justify-center rounded-2xl border">
                  {/* Recommended Courses z pierwszej ścieżki */}
                  {recommendations && recommendations.careerPaths[0] && (
                    <div className="p-2 text-center">
                      <h5 className="mb-2 text-xs font-semibold">Courses:</h5>
                      <div className="space-y-1">
                        {recommendations.careerPaths[0].recommendedCourses
                          .slice(0, 3)
                          .map((course, index) => (
                            <div key={index} className="rounded bg-green-100 px-2 py-1 text-xs">
                              {course}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex h-2/3 w-full items-center justify-center rounded-2xl border">
                {/* Szczegóły pierwszej ścieżki */}
                {recommendations && recommendations.careerPaths[0] && (
                  <div className="w-full p-4">
                    <h4 className="mb-3 text-center font-semibold">
                      {recommendations.careerPaths[0].careerName}
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="font-medium">Probability:</span>{' '}
                        {Math.round(recommendations.careerPaths[0].probability * 100)}%
                      </p>
                      <p>
                        <span className="font-medium">Required Skills:</span>{' '}
                        {recommendations.careerPaths[0].requiredSkills.length} total
                      </p>
                      <p>
                        <span className="font-medium">Courses Available:</span>{' '}
                        {recommendations.careerPaths[0].recommendedCourses.length}
                      </p>
                      <div className="mt-2">
                        <span className="font-medium">Market Analysis:</span>
                        <div className="mt-1 space-y-1 text-xs">
                          {recommendations.careerPaths[0].marketAnalysis
                            .slice(0, 2)
                            .map((analysis, index) => (
                              <p key={index} className="rounded bg-gray-100 p-1">
                                {analysis}
                              </p>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex h-[416px] w-full flex-col rounded-2xl border lg:w-[35%]">
              {/* Druga ścieżka - szczegóły */}
              {recommendations && recommendations.careerPaths[1] && (
                <div className="h-full w-full p-4">
                  <h4 className="mb-3 text-center font-semibold">
                    {recommendations.careerPaths[1].careerName}
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="mb-1 font-medium">Description:</p>
                      <p className="text-xs text-gray-600">
                        {recommendations.careerPaths[1].description}
                      </p>
                    </div>
                    <div>
                      <p className="mb-1 font-medium">Required Skills:</p>
                      <div className="flex flex-wrap gap-1">
                        {recommendations.careerPaths[1].requiredSkills
                          .slice(0, 5)
                          .map((skill, index) => (
                            <span key={index} className="rounded bg-blue-100 px-2 py-1 text-xs">
                              {skill}
                            </span>
                          ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-1 font-medium">SWOT Analysis:</p>
                      <div className="space-y-1 text-xs">
                        <div className="rounded bg-green-50 p-2">
                          <strong>Strengths:</strong>{' '}
                          {recommendations.careerPaths[1].swot.strengths.slice(0, 2).join(', ')}
                        </div>
                        <div className="rounded bg-red-50 p-2">
                          <strong>Weaknesses:</strong>{' '}
                          {recommendations.careerPaths[1].swot.weaknesses.slice(0, 2).join(', ')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex h-[416px] w-full flex-col space-y-4 lg:w-[30%]">
              <div className="flex h-[40%] w-full items-center justify-center rounded-2xl border">
                {/* Recommended Courses */}
                {recommendations && recommendations.careerPaths[0] && (
                  <div className="w-full p-3 text-center">
                    <h5 className="mb-2 text-sm font-semibold">Recommended Courses</h5>
                    <div className="space-y-1">
                      {recommendations.careerPaths[0].recommendedCourses
                        .slice(0, 3)
                        .map((course, index) => (
                          <div key={index} className="rounded bg-yellow-100 px-2 py-1 text-xs">
                            {course}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex h-[60%] w-full items-center justify-center rounded-2xl border">
                {/* SWOT Analysis */}
                {recommendations && recommendations.careerPaths[0] && (
                  <div className="w-full p-3">
                    <h5 className="mb-3 text-center text-sm font-semibold">SWOT Analysis</h5>
                    <div className="space-y-2">
                      <div className="rounded bg-green-100 p-2">
                        <h6 className="text-xs font-semibold text-green-800">Opportunities:</h6>
                        <div className="mt-1 space-y-1">
                          {recommendations.careerPaths[0].swot.opportunities
                            .slice(0, 2)
                            .map((opp, index) => (
                              <p key={index} className="text-xs text-green-700">
                                {opp}
                              </p>
                            ))}
                        </div>
                      </div>
                      <div className="rounded bg-red-100 p-2">
                        <h6 className="text-xs font-semibold text-red-800">Threats:</h6>
                        <div className="mt-1 space-y-1">
                          {recommendations.careerPaths[0].swot.threats
                            .slice(0, 2)
                            .map((threat, index) => (
                              <p key={index} className="text-xs text-red-700">
                                {threat}
                              </p>
                            ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 text-center">
                      <button
                        onClick={loadRecommendations}
                        className="rounded bg-gray-200 px-3 py-2 text-xs hover:bg-gray-300"
                      >
                        Refresh Data
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewAssistantComponent;
