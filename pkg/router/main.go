package router

import (
	"encoding/json"
	"fmt"
	"log/slog"

	"github.com/rollmelette/rollmelette"
)

type AdvanceHandlerFunc func(env rollmelette.Env, metadata rollmelette.Metadata, deposit rollmelette.Deposit, payload []byte) error
type InspectHandlerFunc func(env rollmelette.EnvInspector, payload []byte) error

type Router struct {
	AdvanceHandlers map[string]AdvanceHandlerFunc
	InspectHandlers map[string]InspectHandlerFunc
}

func NewRouter() *Router {
	return &Router{
		AdvanceHandlers: make(map[string]AdvanceHandlerFunc),
		InspectHandlers: make(map[string]InspectHandlerFunc),
	}
}

type AdvanceRequest struct {
	Path    string `json:"path"`
	Payload []byte `json:"payload"`
}

func (r *Router) parseAdvanceRawPayload(rawRequest []byte) (*AdvanceRequest, error) {
	var input AdvanceRequest
	if err := json.Unmarshal(rawRequest, &input); err != nil {
		return nil, fmt.Errorf("failed to decode payload: %w", err)
	}
	return &input, nil
}

func (r *Router) ParseInspectPayload(rawPayload []byte) (*AdvanceRequest, error) {
	return nil, nil
}

func (r *Router) HandleAdvance(path string, handler AdvanceHandlerFunc) {
	r.AdvanceHandlers[path] = handler
}

func (r *Router) HandleInspect(path string, handler InspectHandlerFunc) {
	r.InspectHandlers[path] = handler
}

func (r *Router) Advance(env rollmelette.Env, metadata rollmelette.Metadata, deposit rollmelette.Deposit, payload []byte) error {
	input, err := r.parseAdvanceRawPayload(payload)
	if err != nil {
		return fmt.Errorf("failed to parse input: %w", err)
	}
	
	slog.Debug("Router", "path", input.Path)
	
	handler, ok := r.AdvanceHandlers[input.Path]
	if !ok {
		return fmt.Errorf("path '%s' not found", input.Path)
	}
	if err := handler(env, metadata, deposit, input.Payload); err != nil {
		return fmt.Errorf("failed to handle action '%s': %w", input.Path, err)
	}
	return nil
}

func (r *Router) Inspect(env rollmelette.EnvInspector, payload []byte) error {
	return nil
}