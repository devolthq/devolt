package contract_usecase

import (
	"testing"
	"time"

	"github.com/devolthq/devolt/internal/domain/entity"
	repository "github.com/devolthq/devolt/internal/infra/repository/mock"
	"github.com/devolthq/devolt/pkg/custom_type"
	"github.com/ethereum/go-ethereum/common"
	"github.com/stretchr/testify/assert"
)

func TestFindAllContractsUseCase(t *testing.T) {
	mockRepo := new(repository.MockContractRepository)
	findAllContractsUseCase := NewFindAllContractsUseCase(mockRepo)

	createdAt := time.Now().Unix()
	updatedAt := time.Now().Unix()

	mockContracts := []*entity.Contract{
		{
			Id:        1,
			Symbol:    "VOLT",
			Address:   custom_type.NewAddress(common.HexToAddress("0x123")),
			CreatedAt: createdAt,
			UpdatedAt: updatedAt,
		},
		{
			Id:        2,
			Symbol:    "AMP",
			Address:   custom_type.NewAddress(common.HexToAddress("0x456")),
			CreatedAt: createdAt,
			UpdatedAt: updatedAt,
		},
	}

	mockRepo.On("FindAllContracts").Return(mockContracts, nil)

	output, err := findAllContractsUseCase.Execute()

	assert.Nil(t, err)
	assert.NotNil(t, output)
	assert.Equal(t, len(mockContracts), len(output))

	for i, contract := range mockContracts {
		assert.Equal(t, contract.Id, output[i].Id)
		assert.Equal(t, contract.Symbol, output[i].Symbol)
		assert.Equal(t, contract.Address, output[i].Address)
		assert.Equal(t, contract.CreatedAt, output[i].CreatedAt)
		assert.Equal(t, contract.UpdatedAt, output[i].UpdatedAt)
	}

	mockRepo.AssertExpectations(t)
}
