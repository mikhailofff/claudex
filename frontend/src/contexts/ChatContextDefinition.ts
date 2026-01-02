import { createContext } from 'react';
import type { FileStructure, CustomAgent, CustomCommand, CustomPrompt } from '@/types';
import type { SandboxProviderType } from '@/config/constants';

export interface ChatContextValue {
  chatId?: string;
  sandboxId?: string;
  sandboxProvider?: SandboxProviderType;
  fileStructure: FileStructure[];
  customAgents: CustomAgent[];
  customSlashCommands: CustomCommand[];
  customPrompts: CustomPrompt[];
}

export const ChatContext = createContext<ChatContextValue | null>(null);
