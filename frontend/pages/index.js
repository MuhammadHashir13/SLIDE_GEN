import { useState } from "react";
import Head from "next/head";
import SlideGenerator from "../components/SlideGenerator";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Slide Generator</title>
        <meta name="description" content="Generate beautiful slides with AI" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8">
          AI Slide Generator
        </h1>
        <SlideGenerator />
      </main>
    </div>
  );
}
