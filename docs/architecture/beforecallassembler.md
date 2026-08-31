# Before-Call Assembler Architecture

## Purpose
The Before-Call Assembler is responsible for constructing the complete context package that will be sent to the OpenAI Realtime Agent before a training session begins.  

It combines:  
- Scenario configuration
- User learning memory
- Previous session performance
- Difficulty settings  

### High-Level Flow

```mermaid
graph TB;
        A[User Starts Session] --> B[Before-Call Assembler]
        B --> C[Load Scenarios <br> Load Learning Memory <br> Apply Difficulty Rules <br> Build Prompt Package]
        C --> D[OpenAI Realtime Agent]

```