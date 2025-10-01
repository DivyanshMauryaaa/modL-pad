'use client'

import React, { useState, useEffect } from 'react';
import { Github, Sparkles, MessageSquare, Zap, ArrowRight, Star, Brain, Clock, Shield, Folder, Bot, Link, Check } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Navbar */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-black/80 backdrop-blur-lg border-b border-white/10' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6" />
            <span className="text-xl font-bold">modL-pad</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="https://github.com/divyanshMauryaaa/modL-pad" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-gray-300 transition-colors">
              <Github className="w-5 h-5" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
            <a href="/dashboard" className="px-6 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-all font-medium">
              Launch App
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 mb-8 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm">Save hours every day</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent leading-tight">
            Remove Friction. Interact Smartly with AI.
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto">
            Chat with multiple AI models in one unified interface. Complete contextual control. Save hours every day.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a href="/dashboard" className="group px-8 py-4 bg-white text-black rounded-lg hover:bg-gray-200 transition-all font-medium flex items-center gap-2 text-lg">
              Start Chatting
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <a href="https://github.com/divyanshMauryaaa/modL-pad" target="_blank" rel="noopener noreferrer" className="px-8 py-4 border border-white/20 rounded-lg hover:bg-white/5 transition-all font-medium flex items-center gap-2 text-lg">
              <Github className="w-5 h-5" />
              View Source
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-20 max-w-2xl mx-auto">
            {[
              { label: "AI Models", value: "Multiple" },
              { label: "Context Control", value: "100%" },
              { label: "Time Saved", value: "Hours" }
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Animated gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '700ms' }} />
      </section>

      {/* Problem Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-transparent to-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-400">
            Tired of juggling multiple AI chat windows?
          </h2>
          <p className="text-xl text-gray-500 mb-8">
            Switching between ChatGPT, Claude, Gemini, and others wastes time and breaks your flow.
          </p>
          <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
            ModLpad fixes that.
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
              One Interface, Infinite Possibilities
            </h2>
            <p className="text-gray-400 text-lg">Everything you need to work with AI models efficiently</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                icon: <MessageSquare className="w-8 h-8" />,
                title: "Unified Chat",
                description: "Access multiple AI models from a single, clean interface. No more tab switching."
              },
              {
                icon: <Shield className="w-8 h-8" />,
                title: "Context Control",
                description: "Complete control over conversation context. Manage what AI remembers and uses."
              },
              {
                icon: <Clock className="w-8 h-8" />,
                title: "Save Hours",
                description: "Stop wasting time switching tools. Focus on what matters - getting work done."
              },
              {
                icon: <Folder className="w-8 h-8" />,
                title: "Centralised Context",
                description: "Save, edit and organize responses into folders & connect them to agents for faster and more consistent AI interactions."
              },
            ].map((feature, i) => (
              <div key={i} className="group p-8 rounded-2xl bg-gradient-to-b from-white/5 to-white/0 border border-white/10 hover:border-white/20 transition-all hover:transform hover:scale-105">
                <div className="mb-4 text-white/80 group-hover:text-white transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Chat Preview Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-2xl bg-gradient-to-b from-white/10 to-white/5 border border-white/20 overflow-hidden backdrop-blur-sm">
            <Image src="/chatDemo.png" alt="Chat Demo" width={1800} height={1000} />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-gradient-to-b from-white/5 to-transparent">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
            Simple, Yet Powerful AI Chat
          </h2>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { step: "01", title: "Connect", desc: "Create a project & configure agents as required" },
              { step: "02", title: "Chat", desc: "Start conversations with any agent using @agentName" },
              { step: "03", title: "Control", desc: "Manage context and switch models seamlessly" }
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="text-6xl font-bold text-white/10 mb-4">{item.step}</div>
                <h3 className="text-2xl font-semibold mb-3">{item.title}</h3>
                <p className="text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent">
            Ready to Streamline Your AI Workflow?
          </h2>
          <p className="text-gray-400 text-xl mb-8">
            Stop wasting time. Start being productive with AI models today.
          </p>
          <a href="/dashboard" className="group inline-flex items-center gap-2 px-8 py-4 bg-white text-black rounded-lg hover:bg-gray-200 transition-all font-medium text-lg">
            Get Started Free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>
          <p className="text-sm text-gray-500 mt-4">Open source • Time-saving • Full control</p>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent">
            Transparent, Scalable Pricing
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8 mt-5">
          {[
            { title: "Free", price: "0", features: ["3 Messages per day", "3 folders", "10 saved responses", "Limited models", "3 Agents", "No Media Models"] },
            { title: "Pro", price: "20", features: ["Higher Limits", "Unlimited folders", "Unlimited saved responses", "Pro Models access", "Unlimited Agents", "Image Models"] },
            { title: "Max", price: "200", features: ["Unlimited Messages", "Unlimited folders", "Unlimited saved responses", "All models access", "Unlimited Agents", "Text, Image, Video Models"] }
          ].map((item, i) => (
            <div key={i} className="border dark:border-gray-700 rounded-xl p-6 border-gray-300">
              <h3 className="text-2xl mb-3">{item.title}</h3>
              <p className="text-gray-400 font-semibold text-6xl">${item.price}<span className='text-sm'>/mo</span></p>
              
              <div className="space-y-2 text-sm mb-6 mt-6 border-t border-gray-300 dark:border-gray-700 pt-6">
                {item.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2"><Check className="w-4 h-4" />{feature}</div>
                ))}
              </div>

              <Button size={'lg'} className='w-full'>Sign Up</Button>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            <span className="font-semibold">modL-pad</span>
          </div>
          <div className="text-gray-400 text-sm">
            Bringing AI models together • Open Source
          </div>
          <a href="https://github.com/divyanshMauryaaa/modL-pad" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <Github className="w-5 h-5" />
            <span>Star on GitHub</span>
          </a>
        </div>
      </footer>
    </div>
  );
}