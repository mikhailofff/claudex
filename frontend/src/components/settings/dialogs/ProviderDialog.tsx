import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button, Input, Label, Switch, Select } from '@/components/ui';
import { BaseModal } from '@/components/ui/shared/BaseModal';
import { SecretInput } from '../inputs/SecretInput';
import type {
  CustomProvider,
  CustomProviderModel,
  ProviderType,
  HelperTextCode,
  HelperTextLink,
} from '@/types';

interface ProviderDialogProps {
  isOpen: boolean;
  provider: CustomProvider | null;
  error?: string | null;
  onClose: () => void;
  onSave: (provider: CustomProvider) => void;
}

const DEFAULT_ANTHROPIC_PROVIDER: Omit<CustomProvider, 'id' | 'auth_token'> = {
  name: 'Anthropic',
  provider_type: 'anthropic',
  enabled: true,
  models: [
    { model_id: 'claude-opus-4-5', name: 'Claude Opus 4.5', enabled: true },
    { model_id: 'claude-sonnet-4-5', name: 'Claude Sonnet 4.5', enabled: true },
    { model_id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5', enabled: true },
  ],
};

const DEFAULT_OPENROUTER_PROVIDER: Omit<CustomProvider, 'id' | 'auth_token'> = {
  name: 'OpenRouter',
  provider_type: 'openrouter',
  enabled: true,
  models: [
    { model_id: 'openai/gpt-5.2', name: 'GPT-5.2', enabled: true },
    { model_id: 'openai/gpt-5.1-codex', name: 'GPT-5.1 Codex', enabled: true },
    { model_id: 'x-ai/grok-code-fast-1', name: 'Grok Code Fast', enabled: true },
    { model_id: 'moonshotai/kimi-k2-thinking', name: 'Kimi K2 Thinking', enabled: true },
    { model_id: 'minimax/minimax-m2', name: 'Minimax M2', enabled: true },
    { model_id: 'deepseek/deepseek-v3.2', name: 'Deepseek V3.2', enabled: true },
  ],
};

const PROVIDER_TYPE_OPTIONS = [
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'openrouter', label: 'OpenRouter' },
  { value: 'custom', label: 'Custom' },
];

const createEmptyProvider = (): CustomProvider => ({
  id: crypto.randomUUID(),
  name: '',
  provider_type: 'custom',
  base_url: '',
  auth_token: '',
  enabled: true,
  models: [],
});

const createProviderFromType = (providerType: ProviderType): CustomProvider => {
  const id = crypto.randomUUID();
  switch (providerType) {
    case 'anthropic':
      return { ...DEFAULT_ANTHROPIC_PROVIDER, id, auth_token: '' };
    case 'openrouter':
      return { ...DEFAULT_OPENROUTER_PROVIDER, id, auth_token: '' };
    default:
      return createEmptyProvider();
  }
};

const createEmptyModel = (): CustomProviderModel => ({
  model_id: '',
  name: '',
  enabled: true,
});

const getAuthTokenConfig = (
  providerType: ProviderType,
): {
  label: string;
  placeholder: string;
  helperText?: HelperTextCode | HelperTextLink;
} => {
  switch (providerType) {
    case 'anthropic':
      return {
        label: 'OAuth Token',
        placeholder: 'Paste token from claude setup-token',
        helperText: {
          prefix: 'Requires Claude Max ($100-200/mo). Run',
          code: 'claude setup-token',
          suffix: 'in terminal',
        },
      };
    case 'openrouter':
      return {
        label: 'API Key',
        placeholder: 'Enter your OpenRouter API key',
        helperText: {
          prefix: 'Get your API key from',
          anchorText: 'openrouter.ai',
          href: 'https://openrouter.ai/keys',
        },
      };
    case 'custom':
    default:
      return {
        label: 'API Key',
        placeholder: 'Enter API key (if required)',
        helperText: {
          prefix: 'API key for authentication (if required)',
          code: '',
          suffix: '',
        },
      };
  }
};

export const ProviderDialog: React.FC<ProviderDialogProps> = ({
  isOpen,
  provider,
  error,
  onClose,
  onSave,
}) => {
  const [form, setForm] = useState<CustomProvider>(createEmptyProvider());
  const [showToken, setShowToken] = useState(false);
  const [newModel, setNewModel] = useState<CustomProviderModel>(createEmptyModel());
  const [modelError, setModelError] = useState<string | null>(null);
  const [selectedProviderType, setSelectedProviderType] = useState<ProviderType>('anthropic');

  useEffect(() => {
    if (isOpen) {
      if (provider) {
        setForm({ ...provider });
        setSelectedProviderType(provider.provider_type);
      } else {
        setSelectedProviderType('anthropic');
        setForm(createProviderFromType('anthropic'));
      }
      setShowToken(false);
      setNewModel(createEmptyModel());
      setModelError(null);
    }
  }, [isOpen, provider]);

  const handleProviderTypeChange = (providerType: ProviderType) => {
    setSelectedProviderType(providerType);
    const currentToken = form.auth_token;
    const newProviderForm = createProviderFromType(providerType);
    setForm({ ...newProviderForm, auth_token: currentToken });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  const handleAddModel = () => {
    if (!newModel.model_id.trim()) {
      setModelError('Model ID is required');
      return;
    }
    if (!newModel.name.trim()) {
      setModelError('Model name is required');
      return;
    }
    if (form.models.some((m) => m.model_id === newModel.model_id.trim())) {
      setModelError('A model with this ID already exists');
      return;
    }

    setForm((prev) => ({
      ...prev,
      models: [
        ...prev.models,
        { ...newModel, model_id: newModel.model_id.trim(), name: newModel.name.trim() },
      ],
    }));
    setNewModel(createEmptyModel());
    setModelError(null);
  };

  const handleRemoveModel = (modelId: string) => {
    setForm((prev) => ({
      ...prev,
      models: prev.models.filter((m) => m.model_id !== modelId),
    }));
  };

  const handleToggleModel = (modelId: string) => {
    setForm((prev) => ({
      ...prev,
      models: prev.models.map((m) => (m.model_id === modelId ? { ...m, enabled: !m.enabled } : m)),
    }));
  };

  const isEditing = provider !== null;
  const isBuiltIn = form.provider_type === 'anthropic' || form.provider_type === 'openrouter';
  const showBaseUrl = !isBuiltIn;
  const authConfig = getAuthTokenConfig(form.provider_type);

  const getDialogTitle = () => {
    if (isEditing) return 'Edit Provider';
    switch (selectedProviderType) {
      case 'anthropic':
        return 'Add Anthropic Provider';
      case 'openrouter':
        return 'Add OpenRouter Provider';
      default:
        return 'Add Custom Provider';
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      className="max-h-[90vh] overflow-y-auto shadow-strong"
    >
      <div className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-text-primary dark:text-text-dark-primary">
          {getDialogTitle()}
        </h3>

        {error && (
          <div className="mb-4 rounded-md border border-error-200 bg-error-50 p-3 dark:border-error-800 dark:bg-error-900/20">
            <p className="text-xs text-error-700 dark:text-error-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEditing && (
            <div>
              <Label className="mb-1.5 text-sm text-text-primary dark:text-text-dark-primary">
                Provider Type
              </Label>
              <Select
                value={selectedProviderType}
                onChange={(e) => handleProviderTypeChange(e.target.value as ProviderType)}
              >
                {PROVIDER_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              <p className="mt-1 text-xs text-text-tertiary dark:text-text-dark-tertiary">
                {selectedProviderType === 'custom'
                  ? 'Configure a custom Anthropic-compatible API provider'
                  : `Pre-configured with default ${selectedProviderType === 'anthropic' ? 'Claude' : 'OpenRouter'} models`}
              </p>
            </div>
          )}

          <div>
            <Label className="mb-1.5 text-sm text-text-primary dark:text-text-dark-primary">
              Provider Name
            </Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder={isEditing ? undefined : 'e.g., DeepSeek, Local Ollama'}
              className="text-sm"
              required
            />
          </div>

          {showBaseUrl && (
            <div>
              <Label className="mb-1.5 text-sm text-text-primary dark:text-text-dark-primary">
                Base URL
              </Label>
              <Input
                value={form.base_url || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, base_url: e.target.value }))}
                placeholder="https://api.example.com/v1"
                className="font-mono text-sm"
                required
              />
              <p className="mt-1 text-xs text-text-tertiary dark:text-text-dark-tertiary">
                The base URL for the Anthropic-compatible API endpoint
              </p>
            </div>
          )}

          <div>
            <Label className="mb-1.5 text-sm text-text-primary dark:text-text-dark-primary">
              {authConfig.label}
            </Label>
            <SecretInput
              value={form.auth_token || ''}
              onChange={(value) => setForm((prev) => ({ ...prev, auth_token: value }))}
              placeholder={authConfig.placeholder}
              isVisible={showToken}
              onToggleVisibility={() => setShowToken(!showToken)}
              helperText={authConfig.helperText}
              containerClassName="w-full"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label className="text-sm text-text-primary dark:text-text-dark-primary">
                Models
              </Label>
            </div>
            <div className="space-y-2">
              {form.models.length === 0 && (
                <p className="text-xs italic text-text-tertiary dark:text-text-dark-tertiary">
                  No models configured
                </p>
              )}
              {form.models.map((model) => (
                <div
                  key={model.model_id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-surface-tertiary p-3 dark:border-border-dark dark:bg-surface-dark-tertiary"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-text-primary dark:text-text-dark-primary">
                      {model.name}
                    </div>
                    <div className="font-mono text-xs text-text-tertiary dark:text-text-dark-tertiary">
                      {model.model_id}
                    </div>
                  </div>
                  <Switch
                    checked={model.enabled}
                    onCheckedChange={() => handleToggleModel(model.model_id)}
                    size="sm"
                    aria-label={model.enabled ? 'Disable model' : 'Enable model'}
                  />
                  <Button
                    type="button"
                    onClick={() => handleRemoveModel(model.model_id)}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0 text-error-600 hover:text-error-700 dark:text-error-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <div className="rounded-lg border border-dashed border-border p-3 dark:border-border-dark">
                <div className="mb-2 grid grid-cols-2 gap-2">
                  <Input
                    value={newModel.model_id}
                    onChange={(e) => setNewModel((prev) => ({ ...prev, model_id: e.target.value }))}
                    placeholder="Model ID (e.g., gpt-4)"
                    className="font-mono text-xs"
                  />
                  <Input
                    value={newModel.name}
                    onChange={(e) => setNewModel((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Display Name"
                    className="text-xs"
                  />
                </div>
                {modelError && (
                  <p className="mb-2 text-xs text-error-600 dark:text-error-400">{modelError}</p>
                )}
                <Button
                  type="button"
                  onClick={handleAddModel}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Model
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm text-text-primary dark:text-text-dark-primary">
                Enable Provider
              </Label>
              <p className="mt-0.5 text-xs text-text-tertiary dark:text-text-dark-tertiary">
                Provider models will only be available when enabled
              </p>
            </div>
            <Switch
              checked={form.enabled ?? true}
              onCheckedChange={(checked) => setForm((prev) => ({ ...prev, enabled: checked }))}
              size="sm"
              aria-label="Enable provider"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" onClick={onClose} variant="outline" size="sm">
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              {isEditing ? 'Save Changes' : 'Add Provider'}
            </Button>
          </div>
        </form>
      </div>
    </BaseModal>
  );
};
