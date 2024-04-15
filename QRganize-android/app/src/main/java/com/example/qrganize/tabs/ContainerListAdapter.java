package com.example.qrganize.tabs;

import android.content.Context;
import android.content.Intent;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.qrganize.R;
import com.example.qrganize.container.ContainerActivity;
import com.example.qrganize.container.ContainerModel;

import java.util.List;

public class ItemAdapter extends RecyclerView.Adapter<ItemAdapter.ItemViewHolder> {

    private List<ContainerModel> itemList;
    private Context context;

    public ItemAdapter(List<ContainerModel> itemList, Context context) {
        this.itemList = itemList;
        this.context = context;
    }

    @NonNull
    @Override
    public ItemViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View itemView = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_layout, parent, false);
        return new ItemViewHolder(itemView);
    }

    @Override
    public void onBindViewHolder(@NonNull ItemViewHolder holder, int position) {
        holder.bind(itemList.get(position));
    }

    @Override
    public int getItemCount() {
        return itemList.size();
    }

    public class ItemViewHolder extends RecyclerView.ViewHolder {
        private FrameLayout frame;
        private TextView id;
        private TextView name;
        private TextView owner;

        public ItemViewHolder(@NonNull View itemView) {
            super(itemView);
            frame = itemView.findViewById(R.id.frame);
            id = itemView.findViewById(R.id.id);
            name = itemView.findViewById(R.id.name);
            owner = itemView.findViewById(R.id.owner);

            frame.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    Intent intent = new Intent(context, ContainerActivity.class);
                    intent.putExtra("containerId", id.getText().toString());
                    context.startActivity(intent);
                }
            });
        }

        public void bind(ContainerModel item) {
            id.setText(item.getId());
            name.setText(item.getName());
            owner.setText(item.getOwner());
        }
    }
}
