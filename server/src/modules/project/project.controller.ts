import { Request, Response } from 'express';
import { db } from '../../config/db';
import { projects } from '../../db/schema';
import { env } from '../../config/env';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { eq } from 'drizzle-orm';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

export const getProjectById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    
    if (!project) {
       res.status(404).json({ error: 'Project not found' });
       return;
    }
    res.status(200).json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Internal server error fetching project' });
  }
};

export const updateProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { documentData } = req.body;
    
    await db.update(projects)
      .set({ documentData })
      .where(eq(projects.id, id));
      
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Internal server error while updating project' });
  }
};

export const getAllProjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await db.select().from(projects);
    const sortedProjects = result.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
    res.status(200).json({ success: true, projects: sortedProjects });
  } catch (error) {
    console.error('Error fetching all projects:', error);
    res.status(500).json({ error: 'Internal server error while fetching projects' });
  }
};

export const deleteProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await db.delete(projects).where(eq(projects.id, id));
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Internal server error while deleting project' });
  }
};

export const createProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idea, model } = req.body;

    if (!idea) {
      res.status(400).json({ error: 'Project idea is required' });
      return;
    }

    const modelName = model || 'gemini-2.5-flash';

    const [newProject] = await db
      .insert(projects)
      .values({
        idea,
        modelUsed: modelName,
      })
      .returning();

    res.status(201).json({ id: newProject.id });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Internal server error while creating project.' });
  }
};

export const streamProjectGeneration = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Fetch idea from the newly created project
    const [existingProject] = await db.select().from(projects).where(eq(projects.id, id));
    if (!existingProject) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const { idea, modelUsed } = existingProject;
    if (!idea) {
       res.status(400).json({ error: 'Idea missing from project' });
       return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const aiModel = genAI.getGenerativeModel({ model: modelUsed || 'gemini-2.5-flash' });

    const prompt = `You are an expert technical writer and full-stack developer. Analyze the following project idea and generate a full set of documentation sections formatted in clean, readable Markdown.
Do NOT wrap the output in a JSON object. Just format it as a continuous Markdown document where each section starts with a top-level heading (#).

You MUST include the following sections exactly in this order:
# Overview
# User Workflow
# Design System
# Roles & Auth
# Database Schema
# API Routes
# Frontend
# Backend
# Project Structure
# Gemini Integration
# Deployment
# Extra Features

Be highly detailed, incorporating best practices and specific tech stack recommendations.
Project Idea: ${idea}`;

    const response = await aiModel.generateContentStream(prompt);
    
    let generatedContent = '';

    for await (const chunk of response.stream) {
      const chunkText = chunk.text();
      generatedContent += chunkText;
      
      res.write(`data: ${JSON.stringify({ type: 'content', text: chunkText })}\n\n`);
    }

    // Parse the markdown into structured JSON sections
    const sections: Record<string, string> = {};
    const regex = /(?:^|\n)#\s+([^\n]+)\n([\s\S]*?)(?=(?:\n#\s+|$))/g;
    let match;
    while ((match = regex.exec(generatedContent)) !== null) {
      const sectionName = match[1].trim();
      const sectionContent = match[2].trim();
      if (sectionName && sectionContent) {
        sections[sectionName] = sectionContent;
      }
    }

    await db
      .update(projects)
      .set({
        documentData: Object.keys(sections).length > 0 ? sections : { Document: generatedContent }
      })
      .where(eq(projects.id, id));

    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
  } catch (error) {
    console.error('Error streaming project generation:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error while streaming project generation.' });
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Failed to complete generation' })}\n\n`);
      res.end();
    }
  }
};
