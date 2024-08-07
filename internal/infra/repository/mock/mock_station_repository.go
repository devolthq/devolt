package mock

import (
	"github.com/devolthq/devolt/internal/domain/entity"
	"github.com/stretchr/testify/mock"
)

type MockStationRepository struct {
	mock.Mock
}

func (m *MockStationRepository) CreateStation(input *entity.Station) (*entity.Station, error) {
	args := m.Called(input)
	if args.Get(0) != nil {
		return args.Get(0).(*entity.Station), args.Error(1)
	}
	return nil, args.Error(1)
}

func (m *MockStationRepository) FindStationById(id string) (*entity.Station, error) {
	args := m.Called(id)
	if args.Get(0) != nil {
		return args.Get(0).(*entity.Station), args.Error(1)
	}
	return nil, args.Error(1)
}

func (m *MockStationRepository) FindAllStations() ([]*entity.Station, error) {
	args := m.Called()
	if args.Get(0) != nil {
		return args.Get(0).([]*entity.Station), args.Error(1)
	}
	return nil, args.Error(1)
}

func (m *MockStationRepository) UpdateStation(input *entity.Station) (*entity.Station, error) {
	args := m.Called(input)
	if args.Get(0) != nil {
		return args.Get(0).(*entity.Station), args.Error(1)
	}
	return nil, args.Error(1)
}

func (m *MockStationRepository) DeleteStation(id string) error {
	args := m.Called(id)
	return args.Error(0)
}
